# CCXT Package Patches

This directory contains patches for the `ccxt` package to fix issues specific to automated trading.

## ccxt+4.5.22.patch

**Issue**: The Paradex exchange client in CCXT is missing the `token_usage=interactive` parameter during authentication, which is required for proper JWT token generation.

**Change**: Added `url += '?token_usage=interactive';` after line 2548 in `node_modules/ccxt/dist/cjs/src/paradex.js` in the auth path handler.

```diff
                 headers['PARADEX-SIGNATURE-EXPIRATION'] = query['expiration'].toString();
+                url += '?token_usage=interactive';
             }
```

**Impact**:

- Enables proper authentication with Paradex API
- Ensures JWT tokens are generated with the correct usage scope
- Critical for successful authentication and trading operations

## How to Apply Patches

Patches are automatically applied after running `yarn install` or `npm install` via the `postinstall` script.

To manually apply patches:

```bash
yarn patch-package
```

## Creating New Patches

If you need to modify node_modules and create a new patch:

1. Make your changes directly in `node_modules/package-name`
2. Run: `yarn patch-package package-name`
3. The patch file will be created in the `patches/` directory
4. Commit the patch file to version control

## Important Notes

- **DO NOT** modify files in `node_modules` without creating a corresponding patch
- Always commit patch files to version control
- Document why each patch is needed
- Patches are tied to specific package versions (e.g., ccxt@4.5.22)
- When upgrading packages, verify patches still apply correctly

## Security & Safety

- Patches are reviewed and version-controlled
- Only apply patches that are necessary and well-understood
- Document security implications if any
- Test thoroughly after applying patches

For more information about patch-package, see: https://github.com/ds300/patch-package
