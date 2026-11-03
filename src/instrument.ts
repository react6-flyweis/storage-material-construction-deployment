import * as Sentry from "@sentry/react";
import React from "react";

import {
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
} from "react-router-dom";

if (import.meta.env.PROD) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        initialScope: {
            tags: {
                panel: "construction"
            }
        },
        dataCollection: {
            // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
            // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
            // userInfo: false,
            // httpBodies: [],
        },
        integrations: [
            Sentry.replayIntegration(),
            Sentry.reactRouterV7BrowserTracingIntegration({
                useEffect: React.useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),
        ],
        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for tracing.
        // Learn more at
        // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
        tracesSampleRate: 1.0,
        // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
        tracePropagationTargets: [
            /^\//,
            ...(import.meta.env.VITE_API_BASE_URL ? [import.meta.env.VITE_API_BASE_URL] : []),
        ],
        // Capture Replay for 10% of all sessions,
        // plus for 100% of sessions with an error
        // Learn more at
        // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}
