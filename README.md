Name: DockStar File Vault
Author: Sam Wolfe
Date: Jan 7, 2026

Static Web app hosted by Azure. Securely connects to 'DockStar File Vault' Sharepoint site and displays links to all documents held within. Currently, only those in our Microsoft Organization have access. Will allow partners access with role permissions to only show what we want them to see.

Stack: Next.js, Microsoft Static Web App, Microsoft Graph API, Microsoft Sharepoint

Auth: Microsoft Entra ID auth 

compile local:
    see changes: npm run dev
    static render: npm run build, npx serve@latest out

compile prod: https://kind-rock-0fdb85e10.1.azurestaticapps.net/