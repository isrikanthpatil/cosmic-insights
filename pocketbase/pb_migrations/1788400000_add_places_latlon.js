/// <reference path="../pb_data/types.d.ts" />

// Add lat/lon coordinate fields to the `places` collection so a birthplace can
// resolve to precise coordinates (needed for an accurate Lagna / ascendant),
// instead of falling back to a state centroid.
//
// Both fields are OPTIONAL numbers — the ~558k rows start empty and get
// back-filled by scripts/geocode_places/geocode_places.py from the GeoNames
// India dataset. Rows that never match keep null, and the app falls back to its
// existing city/state lookup, so nothing breaks before the back-fill runs.
//
// Apply: drop this file in  <pocketbase>/pb_migrations/  and restart PocketBase
// (systemctl restart pocketbase). It auto-runs once and is recorded in the
// _migrations table. To reverse:  ./pocketbase migrate down 1
//
// (You can equivalently add the two Number fields by hand in the Admin UI —
//  Collections -> places -> New field -> Number -> "lat", then "lon". This
//  migration just makes that reproducible.)

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("places");

    collection.fields.add(
      new NumberField({
        name: "lat",
        required: false,
        presentable: false,
        system: false,
        min: -90,
        max: 90,
      })
    );

    collection.fields.add(
      new NumberField({
        name: "lon",
        required: false,
        presentable: false,
        system: false,
        min: -180,
        max: 180,
      })
    );

    return app.save(collection);
  },
  (app) => {
    // rollback
    const collection = app.findCollectionByNameOrId("places");
    collection.fields.removeByName("lat");
    collection.fields.removeByName("lon");
    return app.save(collection);
  }
);
