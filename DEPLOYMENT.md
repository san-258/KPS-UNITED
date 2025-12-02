# How to Deploy KPS United

Your website is hosted on **GitHub Pages**. This means deployment is automated!

## The Process
Whenever you push code to the `main` branch of your repository, GitHub automatically detects the changes and updates your live website (`http://kpsunited.com`).

## Step-by-Step Guide

### 0. Verify Your Folder
**Important:** Ensure you are working in the correct folder where the project is set up.
*   **Current Project Path**: `/Users/sp/Documents/KPS Unites/KPS-UNITED`
*   If your files are on the **Desktop**, they might not be connected to this deployment system.
*   **Check**: Do you see this `DEPLOYMENT.md` file in your folder? If yes, you are in the right place!

### 1. Save Your Changes
First, ensure all your open files are saved to your disk.
*   **Mac Menu Bar**: Look at the very top of your physical screen (not the window). Click `File` > `Save All`.
*   **Alternative**: You can also just click `File` > `Save` for each open tab individually.
*   **Keyboard**: `Cmd + Option + S` (Mac) or `Ctrl + K, S` (Windows).

### 2. Commit Your Changes
Open your terminal and run the following commands to save your changes to the history:

```bash
# Add all modified files
git add .

# Commit with a message describing your changes
git commit -m "Description of what you changed"
```

### 3. Push to GitHub
Send your changes to the remote server. This triggers the deployment.

```bash
# Push to the main branch
git push origin main
```

> **Note:** If you are working on a separate branch (like `dashboard-redesign-and-migration`), you first need to merge it into `main`:
> ```bash
> git checkout main
> git merge dashboard-redesign-and-migration
> git push origin main
> git checkout dashboard-redesign-and-migration
> ```

### 4. Wait for Update
It typically takes **1-2 minutes** for GitHub to process the changes.
You can check the status of the deployment in the "Actions" tab of your GitHub repository.

### 5. Verify
Visit `http://kpsunited.com` to see your changes.
*If you don't see them immediately, try a **Hard Refresh** (Cmd+Shift+R on Mac, Ctrl+F5 on Windows).*
