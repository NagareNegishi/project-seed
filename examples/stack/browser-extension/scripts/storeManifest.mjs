// Turns the dev manifest into the one a store build ships: no dev hosts, no pinned key.

const DEV_HOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/;

/**
 * Returns a copy of the manifest without the localhost and 127.0.0.1 entries in
 * host_permissions and externally_connectable, and without `key`. The Chrome
 * dashboard may reject an upload that carries a key, and Edge assigns its own id.
 */
export function storeManifest(manifest) {
  const { key: _key, ...rest } = manifest;
  return {
    ...rest,
    host_permissions: manifest.host_permissions.filter(h => !DEV_HOST.test(h)),
    externally_connectable: {
      ...manifest.externally_connectable,
      matches: manifest.externally_connectable.matches.filter(m => !DEV_HOST.test(m)),
    },
  };
}

/**
 * The Firefox variant of the store manifest: an event page in place of the service worker,
 * no externally_connectable (Firefox lacks it, so users connect by pasting the code),
 * and the id, minimum versions and data declaration AMO requires. 140 and 142 are the
 * first desktop and Android versions that know data_collection_permissions.
 */
export function firefoxManifest(manifest) {
  const { externally_connectable: _unsupported, ...rest } = storeManifest(manifest);
  return {
    ...rest,
    background: { scripts: [manifest.background.service_worker], type: "module" },
    browser_specific_settings: {
      gecko: {
        id: "<project>@<your-domain>",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["websiteContent", "authenticationInfo", "browsingActivity"] },
      },
      gecko_android: { strict_min_version: "142.0" },
    },
  };
}
