# Pixalot

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

### set up Angular Fire

`ng add @angular/fire`

paste the configuration values into environment files
`const firebaseConfig = {
apiKey: ,
authDomain: ,
databaseURL: ,
projectId: ,
storageBucket: ,
messagingSenderId: ,
appId: ,
measurementId: 
};`

add the following to the imports in app.module.ts

`
AngularFireModule.initializeApp(environment.firebaseConfig)
`
// to set <base href="pixr"> build as follows
ng b --prod --base-href Pixalot

// Create a worker for image component 
// NOTE use app until path resolution problem is solved
ng generate web-worker app

TODO research ngZone
