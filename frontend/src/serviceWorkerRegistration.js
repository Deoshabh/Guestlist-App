// This optional code is used to register a service worker.
// It's improved with better error handling and fallbacks.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    try {
      // The URL constructor is available in all browsers that support SW.
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      if (publicUrl.origin !== window.location.origin) {
        // Our service worker won't work if PUBLIC_URL is on a different origin
        // from what our page is served on. This might happen if a CDN is used to
        // serve assets; see https://github.com/facebook/create-react-app/issues/2374
        console.log('Service worker origin mismatch - not registering');
        return;
      }

      window.addEventListener('load', () => {
        try {
          const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

          if (isLocalhost) {
            // This is running on localhost. Check if a service worker still exists or not.
            checkValidServiceWorker(swUrl, config);
          } else {
            // Is not localhost. Just register service worker
            registerValidSW(swUrl, config);
          }
        } catch (error) {
          console.error('Error in service worker load event:', error);
        }
      });
    } catch (error) {
      console.error('Error in service worker registration setup:', error);
    }
  } else {
    console.log('Service Worker not supported or not in production environment');
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        try {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            try {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the updated precached content has been fetched,
                  // but the previous service worker will still serve the older
                  // content until all client tabs are closed.
                  console.log('New content is available and will be used when all tabs are closed.');

                  // Execute callback
                  if (config && config.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  // At this point, everything has been precached.
                  console.log('Content is cached for offline use.');

                  // Execute callback
                  if (config && config.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            } catch (error) {
              console.error('Error in service worker state change:', error);
            }
          };
        } catch (error) {
          console.error('Error in onupdatefound:', error);
        }
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
      if (config && config.onError) {
        config.onError(error);
      }
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
      if (config && config.onOffline) {
        config.onOffline();
      }
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Error unregistering service worker:', error);
      });
  }
}
