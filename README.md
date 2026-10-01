# Oyera Auto Service Bay

## Deploy to Netlify

The app runs as a Netlify Function, with static assets published from `public`. Netlify reads the settings in `netlify.toml`; use the repository root as the site base directory and leave the build command empty.

Before deploying, add these environment variables in **Site configuration > Environment variables**:

- `DATABASE_URL`: MongoDB connection string for a reachable MongoDB Atlas cluster.
- `SESSION_SECRET`: a long, private random value used to sign login sessions.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_TELEPHONE`: credentials and contact number for the first production admin. Keep these private; the account is created only when the database has no admin.
- `DATABASE_NAME`: optional database name (defaults to `Oyera_Auto_Service_Bay`).

Deploy after setting the variables. The function waits for MongoDB before handling each request. Sessions and inventory changes are stored in MongoDB because Netlify's function filesystem is not persistent. The sample inventory is inserted when the MongoDB inventory collection is empty. Hard-coded demo users and records are only seeded outside production. Once the first admin is created, remove the three `ADMIN_*` variables from Netlify's environment settings.
