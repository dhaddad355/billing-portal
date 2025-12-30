# PDF Statement Parser - Technical Specification

## Overview

A .NET 8 console application that processes PDF billing statements from a local directory, extracts metadata, and submits them to the Billing Portal API. The application runs on a scheduled basis (Windows Task Scheduler or similar) and manages file lifecycle through directory-based state management.

---

## Architecture

### High-Level Flow

```
[PDF Source Directory]
        │
        ▼
   ┌─────────────┐
   │  Parser     │──────► Extract metadata from PDF filename/content
   │  Service    │
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │  API        │──────► POST to /api/statement
   │  Client     │
   └─────────────┘
        │
        ├── Success ──► [Completed Directory]
        │
        └── Failure ──► [Failed Directory]
```

### Directory Structure

```
C:\StatementProcessor\
├── Process\           # Input: PDFs awaiting processing
├── Completed\         # Success: PDFs successfully submitted
├── Failed\            # Error: PDFs that failed submission
└── Logs\              # Application logs
```

---

## PDF File Naming Convention

The PDF files MUST follow this naming convention to extract required metadata:

```
{PersonId}_{AccountNumberFull}_{StatementDate}_{PatientBalance}.pdf
```

### Example
```
5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1_ACC001234567_2024-12-15_150.50.pdf
```

### Parsing Rules

| Field | Position | Format | Example |
|-------|----------|--------|---------|
| `PersonId` | 1 | GUID | `5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1` |
| `AccountNumberFull` | 2 | Alphanumeric | `ACC001234567` |
| `StatementDate` | 3 | `yyyy-MM-dd` | `2024-12-15` |
| `PatientBalance` | 4 | Decimal (no currency symbol) | `150.50` |

**Note**: If additional metadata is available (name, contact info), it can be extracted from PDF content using a library like `iTextSharp` or `PdfPig`. For MVP, filename-based extraction is sufficient.

---

## API Specification

### Endpoint

```
POST {BASE_URL}/api/statement
```

### Authentication

| Header | Value | Required |
|--------|-------|----------|
| `x-api-key` | `{STATEMENT_INGEST_API_KEY}` | Yes |

The API key is validated server-side against the `STATEMENT_INGEST_API_KEY` environment variable.

### Request Format

The API accepts two content types:

#### Option A: Multipart Form Data (Recommended)

```http
POST /api/statement HTTP/1.1
Host: {BASE_URL}
x-api-key: {API_KEY}
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="person_id"

5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1
------FormBoundary
Content-Disposition: form-data; name="account_number_full"

ACC001234567
------FormBoundary
Content-Disposition: form-data; name="statement_date"

2024-12-15
------FormBoundary
Content-Disposition: form-data; name="patient_balance"

150.50
------FormBoundary
Content-Disposition: form-data; name="statement_pdf"; filename="statement.pdf"
Content-Type: application/pdf

{PDF_BINARY_DATA}
------FormBoundary--
```

#### Option B: JSON with Base64 PDF

```http
POST /api/statement HTTP/1.1
Host: {BASE_URL}
x-api-key: {API_KEY}
Content-Type: application/json

{
    "person_id": "5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1",
  "account_number_full": "ACC001234567",
  "statement_date": "2024-12-15",
  "patient_balance": 150.50,
  "pdf_base64": "{BASE64_ENCODED_PDF}"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `person_id` | string (UUID) | **Yes** | Patient identifier from NextGen (GUID) |
| `account_number_full` | string | **Yes** | Full account number |
| `patient_balance` | decimal | **Yes** | Current balance amount |
| `statement_date` | string (date) | No | Statement date (`yyyy-MM-dd`). Defaults to current date if omitted |
| `account_number_suffix` | integer | No | Account number suffix (if applicable) |
| `first_name` | string | No | Patient first name |
| `last_name` | string | No | Patient last name |
| `email_address` | string | No | Patient email for notifications |
| `cell_phone` | string | No | Patient cell phone for SMS notifications |
| `last_statement_date` | string (date) | No | Previous statement date |
| `last_pay_date` | string (date) | No | Date of last payment |
| `next_statement_date` | string (date) | No | Expected next statement date |
| `statement_pdf` | file | **Yes*** | PDF file (multipart only) |
| `pdf_base64` | string | **Yes*** | Base64-encoded PDF (JSON only) |

*One of `statement_pdf` or `pdf_base64` is required.

### Response Format

#### Success (200 OK)

```json
{
  "success": true,
  "statementId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Error Responses

**401 Unauthorized** - Invalid or missing API key
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "error": "person_id is required"
}
```

```json
{
  "success": false,
  "error": "account_number_full is required"
}
```

```json
{
  "success": false,
  "error": "patient_balance is required"
}
```

```json
{
  "success": false,
  "error": "PDF file is required"
}
```

```json
{
  "success": false,
  "error": "Invalid file type. Only PDF files are accepted."
}
```

```json
{
  "success": false,
  "error": "Invalid PDF file format"
}
```

**500 Internal Server Error** - Server-side error
```json
{
  "success": false,
  "error": "Failed to save person data"
}
```

```json
{
  "success": false,
  "error": "Failed to upload PDF"
}
```

```json
{
  "success": false,
  "error": "Failed to save statement"
}
```

---

## .NET Application Structure

### Project Structure

```
StatementParser/
├── StatementParser.sln
├── src/
│   └── StatementParser/
│       ├── StatementParser.csproj
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Models/
│       │   ├── StatementMetadata.cs
│       │   └── ApiResponse.cs
│       ├── Services/
│       │   ├── IFileProcessor.cs
│       │   ├── FileProcessor.cs
│       │   ├── IPdfParser.cs
│       │   ├── PdfParser.cs
│       │   ├── IStatementApiClient.cs
│       │   └── StatementApiClient.cs
│       └── Configuration/
│           └── AppSettings.cs
└── tests/
    └── StatementParser.Tests/
        ├── StatementParser.Tests.csproj
        ├── PdfParserTests.cs
        └── FileProcessorTests.cs
```

### Configuration (appsettings.json)

```json
{
  "StatementParser": {
    "ProcessDirectory": "C:\\StatementProcessor\\Process",
    "CompletedDirectory": "C:\\StatementProcessor\\Completed",
    "FailedDirectory": "C:\\StatementProcessor\\Failed",
    "ApiBaseUrl": "https://your-billing-portal.com",
    "ApiKey": "",
    "MaxRetries": 3,
    "RetryDelayMs": 1000,
    "TimeoutSeconds": 30,
    "FilePattern": "*.pdf",
    "MoveFailedFiles": true,
    "LogLevel": "Information"
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      {
        "Name": "Console"
      },
      {
        "Name": "File",
        "Args": {
          "path": "C:\\StatementProcessor\\Logs\\parser-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ]
  }
}
```

### Models

#### StatementMetadata.cs

```csharp
namespace StatementParser.Models;

public class StatementMetadata
{
    public required Guid PersonId { get; set; }
    public required string AccountNumberFull { get; set; }
    public required decimal PatientBalance { get; set; }
    public DateTime? StatementDate { get; set; }
    public int? AccountNumberSuffix { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? EmailAddress { get; set; }
    public string? CellPhone { get; set; }
    public DateTime? LastStatementDate { get; set; }
    public DateTime? LastPayDate { get; set; }
    public DateTime? NextStatementDate { get; set; }
    public required string FilePath { get; set; }
}
```

#### ApiResponse.cs

```csharp
namespace StatementParser.Models;

public class ApiResponse
{
    public bool Success { get; set; }
    public string? StatementId { get; set; }
    public string? Error { get; set; }
}
```

### Core Services

#### IStatementApiClient.cs

```csharp
namespace StatementParser.Services;

public interface IStatementApiClient
{
    Task<ApiResponse> SubmitStatementAsync(
        StatementMetadata metadata,
        byte[] pdfContent,
        CancellationToken cancellationToken = default);
}
```

#### StatementApiClient.cs (Implementation)

```csharp
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using StatementParser.Configuration;
using StatementParser.Models;

namespace StatementParser.Services;

public class StatementApiClient : IStatementApiClient
{
    private readonly HttpClient _httpClient;
    private readonly AppSettings _settings;
    private readonly ILogger<StatementApiClient> _logger;

    public StatementApiClient(
        HttpClient httpClient,
        IOptions<AppSettings> settings,
        ILogger<StatementApiClient> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        _httpClient.BaseAddress = new Uri(_settings.ApiBaseUrl);
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _settings.ApiKey);
        _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);
    }

    public async Task<ApiResponse> SubmitStatementAsync(
        StatementMetadata metadata,
        byte[] pdfContent,
        CancellationToken cancellationToken = default)
    {
        using var content = new MultipartFormDataContent();

        // Add required fields
        content.Add(new StringContent(metadata.PersonId.ToString()), "person_id");
        content.Add(new StringContent(metadata.AccountNumberFull), "account_number_full");
        content.Add(new StringContent(metadata.PatientBalance.ToString("F2")), "patient_balance");

        // Add optional fields
        if (metadata.StatementDate.HasValue)
            content.Add(new StringContent(metadata.StatementDate.Value.ToString("yyyy-MM-dd")), "statement_date");

        if (metadata.AccountNumberSuffix.HasValue)
            content.Add(new StringContent(metadata.AccountNumberSuffix.Value.ToString()), "account_number_suffix");

        if (!string.IsNullOrEmpty(metadata.FirstName))
            content.Add(new StringContent(metadata.FirstName), "first_name");

        if (!string.IsNullOrEmpty(metadata.LastName))
            content.Add(new StringContent(metadata.LastName), "last_name");

        if (!string.IsNullOrEmpty(metadata.EmailAddress))
            content.Add(new StringContent(metadata.EmailAddress), "email_address");

        if (!string.IsNullOrEmpty(metadata.CellPhone))
            content.Add(new StringContent(metadata.CellPhone), "cell_phone");

        if (metadata.LastStatementDate.HasValue)
            content.Add(new StringContent(metadata.LastStatementDate.Value.ToString("yyyy-MM-dd")), "last_statement_date");

        if (metadata.LastPayDate.HasValue)
            content.Add(new StringContent(metadata.LastPayDate.Value.ToString("yyyy-MM-dd")), "last_pay_date");

        if (metadata.NextStatementDate.HasValue)
            content.Add(new StringContent(metadata.NextStatementDate.Value.ToString("yyyy-MM-dd")), "next_statement_date");

        // Add PDF file
        var pdfContent = new ByteArrayContent(pdfContent);
        pdfContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(pdfContent, "statement_pdf", Path.GetFileName(metadata.FilePath));

        // Send request with retry logic
        var retryCount = 0;
        while (retryCount <= _settings.MaxRetries)
        {
            try
            {
                var response = await _httpClient.PostAsync("/api/statement", content, cancellationToken);
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

                var apiResponse = JsonSerializer.Deserialize<ApiResponse>(responseBody,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (apiResponse == null)
                {
                    return new ApiResponse { Success = false, Error = "Failed to parse API response" };
                }

                return apiResponse;
            }
            catch (HttpRequestException ex) when (retryCount < _settings.MaxRetries)
            {
                retryCount++;
                _logger.LogWarning(ex, "Request failed, attempt {Attempt} of {MaxRetries}",
                    retryCount, _settings.MaxRetries);
                await Task.Delay(_settings.RetryDelayMs * retryCount, cancellationToken);
            }
        }

        return new ApiResponse { Success = false, Error = "Max retries exceeded" };
    }
}
```

#### IPdfParser.cs

```csharp
namespace StatementParser.Services;

public interface IPdfParser
{
    StatementMetadata ParseFromFilename(string filePath);
    bool ValidatePdfFile(string filePath);
}
```

#### PdfParser.cs

```csharp
using System.Text.RegularExpressions;
using StatementParser.Models;

namespace StatementParser.Services;

public class PdfParser : IPdfParser
{
    private readonly ILogger<PdfParser> _logger;

    // Pattern: {PersonId}_{AccountNumberFull}_{StatementDate}_{PatientBalance}.pdf
    private static readonly Regex FilenamePattern = new(
        @"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})_([A-Za-z0-9]+)_(\d{4}-\d{2}-\d{2})_(\d+\.?\d*)\.pdf$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public PdfParser(ILogger<PdfParser> logger)
    {
        _logger = logger;
    }

    public StatementMetadata ParseFromFilename(string filePath)
    {
        var filename = Path.GetFileName(filePath);
        var match = FilenamePattern.Match(filename);

        if (!match.Success)
        {
            throw new FormatException(
                $"Filename '{filename}' does not match expected pattern: " +
                "{PersonId}_{AccountNumberFull}_{StatementDate}_{PatientBalance}.pdf");
        }

        return new StatementMetadata
        {
            PersonId = Guid.Parse(match.Groups[1].Value),
            AccountNumberFull = match.Groups[2].Value,
            StatementDate = DateTime.ParseExact(match.Groups[3].Value, "yyyy-MM-dd", null),
            PatientBalance = decimal.Parse(match.Groups[4].Value),
            FilePath = filePath
        };
    }

    public bool ValidatePdfFile(string filePath)
    {
        try
        {
            using var stream = File.OpenRead(filePath);
            var header = new byte[5];
            var bytesRead = stream.Read(header, 0, 5);

            if (bytesRead < 5)
                return false;

            // Check for PDF magic bytes: %PDF-
            return header[0] == 0x25 && // %
                   header[1] == 0x50 && // P
                   header[2] == 0x44 && // D
                   header[3] == 0x46 && // F
                   header[4] == 0x2D;   // -
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating PDF file: {FilePath}", filePath);
            return false;
        }
    }
}
```

#### IFileProcessor.cs

```csharp
namespace StatementParser.Services;

public interface IFileProcessor
{
    Task ProcessAllFilesAsync(CancellationToken cancellationToken = default);
}
```

#### FileProcessor.cs

```csharp
using Microsoft.Extensions.Options;
using StatementParser.Configuration;

namespace StatementParser.Services;

public class FileProcessor : IFileProcessor
{
    private readonly IPdfParser _pdfParser;
    private readonly IStatementApiClient _apiClient;
    private readonly AppSettings _settings;
    private readonly ILogger<FileProcessor> _logger;

    public FileProcessor(
        IPdfParser pdfParser,
        IStatementApiClient apiClient,
        IOptions<AppSettings> settings,
        ILogger<FileProcessor> logger)
    {
        _pdfParser = pdfParser;
        _apiClient = apiClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task ProcessAllFilesAsync(CancellationToken cancellationToken = default)
    {
        EnsureDirectoriesExist();

        var files = Directory.GetFiles(_settings.ProcessDirectory, _settings.FilePattern);
        _logger.LogInformation("Found {Count} files to process", files.Length);

        foreach (var filePath in files)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            await ProcessFileAsync(filePath, cancellationToken);
        }
    }

    private async Task ProcessFileAsync(string filePath, CancellationToken cancellationToken)
    {
        var filename = Path.GetFileName(filePath);
        _logger.LogInformation("Processing file: {Filename}", filename);

        try
        {
            // Validate PDF
            if (!_pdfParser.ValidatePdfFile(filePath))
            {
                _logger.LogError("Invalid PDF file: {Filename}", filename);
                MoveToFailed(filePath, "invalid_pdf");
                return;
            }

            // Parse metadata from filename
            var metadata = _pdfParser.ParseFromFilename(filePath);

            // Read PDF content
            var pdfContent = await File.ReadAllBytesAsync(filePath, cancellationToken);

            // Submit to API
            var response = await _apiClient.SubmitStatementAsync(metadata, pdfContent, cancellationToken);

            if (response.Success)
            {
                _logger.LogInformation(
                    "Successfully submitted statement {StatementId} for file {Filename}",
                    response.StatementId, filename);
                MoveToCompleted(filePath);
            }
            else
            {
                _logger.LogError(
                    "Failed to submit statement for file {Filename}: {Error}",
                    filename, response.Error);
                MoveToFailed(filePath, response.Error ?? "unknown_error");
            }
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Failed to parse filename: {Filename}", filename);
            MoveToFailed(filePath, "invalid_filename");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing file: {Filename}", filename);
            MoveToFailed(filePath, "unexpected_error");
        }
    }

    private void MoveToCompleted(string filePath)
    {
        var filename = Path.GetFileName(filePath);
        var destPath = Path.Combine(_settings.CompletedDirectory,
            $"{DateTime.Now:yyyyMMdd}_{filename}");

        File.Move(filePath, destPath, overwrite: true);
        _logger.LogDebug("Moved to completed: {Destination}", destPath);
    }

    private void MoveToFailed(string filePath, string reason)
    {
        if (!_settings.MoveFailedFiles)
        {
            _logger.LogDebug("MoveFailedFiles disabled, leaving file in place");
            return;
        }

        var filename = Path.GetFileName(filePath);
        var destPath = Path.Combine(_settings.FailedDirectory,
            $"{DateTime.Now:yyyyMMdd}_{reason}_{filename}");

        File.Move(filePath, destPath, overwrite: true);
        _logger.LogDebug("Moved to failed: {Destination}", destPath);
    }

    private void EnsureDirectoriesExist()
    {
        Directory.CreateDirectory(_settings.ProcessDirectory);
        Directory.CreateDirectory(_settings.CompletedDirectory);
        Directory.CreateDirectory(_settings.FailedDirectory);
    }
}
```

### Program.cs

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using StatementParser.Configuration;
using StatementParser.Services;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Statement Parser");

    var host = Host.CreateDefaultBuilder(args)
        .UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services))
        .ConfigureServices((context, services) =>
        {
            services.Configure<AppSettings>(
                context.Configuration.GetSection("StatementParser"));

            services.AddHttpClient<IStatementApiClient, StatementApiClient>();
            services.AddSingleton<IPdfParser, PdfParser>();
            services.AddSingleton<IFileProcessor, FileProcessor>();
        })
        .Build();

    using var scope = host.Services.CreateScope();
    var processor = scope.ServiceProvider.GetRequiredService<IFileProcessor>();

    await processor.ProcessAllFilesAsync();

    Log.Information("Statement Parser completed successfully");
    return 0;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Statement Parser terminated unexpectedly");
    return 1;
}
finally
{
    await Log.CloseAndFlushAsync();
}
```

---

## NuGet Dependencies

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0.0" />
  <PackageReference Include="Microsoft.Extensions.Http" Version="8.0.0" />
  <PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
  <PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
</ItemGroup>
```

---

## Deployment & Scheduling

### Windows Task Scheduler Setup

1. Create a new task with the following properties:
   - **Trigger**: Daily at desired time (e.g., every 15 minutes, hourly, etc.)
   - **Action**: Start a program
   - **Program/script**: `C:\StatementProcessor\StatementParser.exe`
   - **Start in**: `C:\StatementProcessor`

2. Configure the task to:
   - Run whether user is logged on or not
   - Run with highest privileges (if needed for file access)

### Alternative: Windows Service

For continuous processing, the application can be converted to a Windows Service using `Microsoft.Extensions.Hosting.WindowsServices`:

```csharp
Host.CreateDefaultBuilder(args)
    .UseWindowsService(options =>
    {
        options.ServiceName = "StatementParser";
    })
    // ... rest of configuration
```

---

## Error Handling & Recovery

### File Processing Failures

| Failure Type | Action | Destination |
|--------------|--------|-------------|
| Invalid PDF format | Move to Failed | `{date}_invalid_pdf_{filename}` |
| Invalid filename | Move to Failed | `{date}_invalid_filename_{filename}` |
| API 401 Unauthorized | Move to Failed | `{date}_unauthorized_{filename}` |
| API 400 Bad Request | Move to Failed | `{date}_validation_error_{filename}` |
| API 500 Server Error | Retry, then Failed | `{date}_server_error_{filename}` |
| Network timeout | Retry, then Failed | `{date}_timeout_{filename}` |

### Idempotency

The API is designed to handle duplicate submissions gracefully:
- Each statement gets a unique UUID (`statementId`)
- Person records are upserted (created or updated)
- PDFs are stored with unique paths

---

## Testing

### Unit Tests

```csharp
[Fact]
public void ParseFromFilename_ValidFilename_ReturnsCorrectMetadata()
{
    var parser = new PdfParser(Mock.Of<ILogger<PdfParser>>());
    var filePath = @"C:\test\5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1_ACC001234567_2024-12-15_150.50.pdf";

    var result = parser.ParseFromFilename(filePath);

    Assert.Equal(Guid.Parse("5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1"), result.PersonId);
    Assert.Equal("ACC001234567", result.AccountNumberFull);
    Assert.Equal(new DateTime(2024, 12, 15), result.StatementDate);
    Assert.Equal(150.50m, result.PatientBalance);
}

[Fact]
public void ParseFromFilename_InvalidFilename_ThrowsFormatException()
{
    var parser = new PdfParser(Mock.Of<ILogger<PdfParser>>());
    var filePath = @"C:\test\invalid_filename.pdf";

    Assert.Throws<FormatException>(() => parser.ParseFromFilename(filePath));
}
```

### Integration Testing

Use a local test instance of the API or mock the HTTP client to test the full flow without affecting production.

---

## Monitoring & Alerting

### Log Output Examples

**Successful processing:**
```
[INF] Starting Statement Parser
[INF] Found 5 files to process
[INF] Processing file: 5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1_ACC001234567_2024-12-15_150.50.pdf
[INF] Successfully submitted statement 550e8400-e29b-41d4-a716-446655440000 for file 5c28b1f0-6d9d-4b1d-9f62-4b8f9a23d5a1_ACC001234567_2024-12-15_150.50.pdf
[INF] Statement Parser completed successfully
```

**Failed processing:**
```
[INF] Processing file: invalid.pdf
[ERR] Failed to parse filename: invalid.pdf
System.FormatException: Filename 'invalid.pdf' does not match expected pattern
```

### Recommended Alerts

1. **Failed file threshold**: Alert if > N files in Failed directory
2. **Processing failures**: Alert on consecutive API failures
3. **No files processed**: Alert if no files processed in expected timeframe

---

## Security Considerations

1. **API Key Storage**: Store the API key securely (Windows Credential Manager, Azure Key Vault, or encrypted config)
2. **File Permissions**: Restrict access to directories to service account only
3. **HTTPS Only**: Always use HTTPS for API communication
4. **Input Validation**: Validate PDF files before processing (magic bytes check)
5. **Log Sanitization**: Don't log full file paths or sensitive metadata in production

---

## Future Enhancements

1. **PDF Content Extraction**: Parse metadata directly from PDF content using iTextSharp/PdfPig
2. **Batch Processing**: Submit multiple statements in a single API call
3. **Health Check Endpoint**: Monitor application health via HTTP endpoint
4. **Metrics Collection**: Add Prometheus/OpenTelemetry metrics
5. **Dead Letter Queue**: More sophisticated retry/failure handling
