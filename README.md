# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Desktop app

This repo now includes an Electron desktop wrapper that packages the existing React app with the local Express backend.

To run it locally:

```sh
npm run desktop:dev
```

To build distributable installers:

```sh
npm run desktop:build
```

To build unpacked desktop output (quick local packaging check):

```sh
npm run desktop:pack
```

The desktop app serves the built frontend and API from the same local process, so no extra backend hosting is required.

Desktop installer branding is configured in `package.json`:

- Product name: `Wandr`
- Windows installer icon: `build/wandr-desktop.ico`
- Installer filename pattern: `Wandr-${version}-${os}-${arch}.${ext}`

To update branding, replace `build/wandr-desktop.ico` with your final 256x256 (or multi-size) ICO asset.

## iOS / Android apps

Capacitor is already configured in this repo for native mobile builds.

Typical workflow:

```sh
npm run mobile:sync
npm run mobile:open:android
npm run mobile:open:ios
```

For Android release builds:

```sh
npm run mobile:build:android
```

Explicit Android release commands:

```sh
npm run mobile:build:android:apk
npm run mobile:build:android:aab
npm run mobile:artifacts:android
```

Expected artifacts:

- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

For iOS release builds, open the Xcode project on macOS after syncing:

```sh
npm run mobile:open:ios
```

Mobile builds need a reachable backend URL. Set `VITE_SERVER_URL` to your deployed API before building for iOS or Android if you are not running the backend on the same device.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
