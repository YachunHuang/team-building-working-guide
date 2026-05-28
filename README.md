# TeamBuildingWorkingGuide

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.8.

## Public Site Deployment (Azure Static Web Apps)

This repository is configured to deploy automatically to Azure Static Web Apps when pushing to `master`.

### One-time repository settings

1. Open repository Settings > Secrets and variables > Actions
2. Add secret `AZURE_STATIC_WEB_APPS_API_TOKEN_ASHY_DUNE_0A20F7A1E`
3. Paste the deployment token from your Azure Static Web App resource

### Deploy flow

1. Push code to `master`
2. Wait for workflow `Azure Static Web Apps CI/CD` to complete
3. Open your Azure Static Web App URL

### Local build

Use this command to verify build output locally:

`npm run build`

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
