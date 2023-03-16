import { Interval } from "@interval/sdk";
import "dotenv/config";

import bulk_github_project_editor from "./routes/bulk_github_project_editor.js";

const interval = new Interval({
  apiKey: process.env.INTERVAL_API_KEY,
  routes: {
    bulk_github_project_editor,
  },
});

interval.listen();
