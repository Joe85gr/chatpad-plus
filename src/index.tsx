import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./components/App";
import { loadConfig } from "./utils/config";
import { Suspense } from 'react';


loadConfig().then(() => {
    const container = document.getElementById("app");
    const root = ReactDOM.createRoot(container!);
    root.render(
        <Suspense fallback="...loading">
            <App />
        </Suspense>
    );
});
