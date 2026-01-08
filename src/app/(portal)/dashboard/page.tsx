export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Card 1</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="mt-1 text-xs text-muted-foreground">Coming soon...</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Card 2</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="mt-1 text-xs text-muted-foreground">Coming soon...</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Card 3</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="mt-1 text-xs text-muted-foreground">Coming soon...</p>
        </div>
      </div>
      
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Placeholder
      </div>
    </div>
  );
}
