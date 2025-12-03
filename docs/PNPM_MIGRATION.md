# Migration from npm to pnpm

## What Changed

### Files Modified
- `package.json` - Added `packageManager` field to enforce pnpm version
- `.gitignore` - Added `pnpm-lock.yaml` to be tracked in git

### Files Created
- `.npmrc` - pnpm configuration for Next.js compatibility

### Files Removed
- `package-lock.json` - npm lock file (replaced by `pnpm-lock.yaml`)
- `node_modules/` - Reinstalled with pnpm

## Updated Commands

| npm command | pnpm equivalent |
|-------------|-----------------|
| `npm install` | `pnpm install` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` |
| `npm run <script>` | `pnpm <script>` |
| `npm update` | `pnpm update` |

## Benefits of pnpm

1. **Faster installs** - Up to 2x faster than npm
2. **Disk space efficient** - Uses content-addressable storage (saves ~50% disk space)
3. **Strict by default** - Only dependencies listed in package.json can be imported
4. **Monorepo friendly** - Built-in workspace support

## Running the Project

All existing npm scripts work the same:

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Configuration Notes

The `.npmrc` file includes:
- `shamefully-hoist=true` - Required for Next.js compatibility
- `auto-install-peers=true` - Automatically installs peer dependencies
- `strict-peer-dependencies=false` - Prevents errors with conflicting peer deps

## Git Tracking

- ✅ `pnpm-lock.yaml` should be committed (ensures consistent installs)
- ❌ `node_modules/` remains ignored
