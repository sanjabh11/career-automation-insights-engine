
O*NET Web Services API: Official Documentation
Docs & API Reference:

O*NET Web Services

Full Reference Manual (Overview)

API Features:

RESTful API (GET only, read-only)

JSON and XML support (set Accept: application/json header for JSON)

Returns profiles, codes, skills, tasks, zones, Bright Outlook, technologies, etc.

Reads can include: keyword search, occupation data, job zone, hot technology, crosswalks, career clusters, and more.

Developer Access:

Sign up for developer credentials at services.onetcenter.org

Credentials are required for most API calls.

Interactive Demo:

Try the API live (no coding needed):
API Demo

Sample Code:

Community-supported code snippets for Python, NodeJS, PHP, Ruby, JavaScript, and more:
Web Services Code Samples (v1.9)
Web Services Code Samples (v2.0)

Reference:

Example API usage:

text
https://services.onetcenter.org/ws/online/occupations?keyword=Accountant&username=YOUR_USERNAME&password=YOUR_PASSWORD
Data Coverage:

All endpoints updated with O*NET 30.0 DB.

Supports occupation search, Bright Outlook, STEM, zones, hot tech, skill lookups, and crosswalks.

Error behavior: Standard HTTP codes, detailed errors in JSON/XML (see reference for detail).

Best Practices / Integration Notes for Your Team
Always use credentials for calls (no public anonymous access).

Use batch/paginated reads for large queries (e.g., all occupations in a job zone).

Review sample code for direct integration patterns.

Use the same taxonomy/codes as official O*NET (for data and parity).

Set appropriate Accept headers (application/json) for JSON results.

Sharing/Reference Link:

Core doc: https://services.onetcenter.org/reference/

API explorer: https://services.onetcenter.org/demo/

Sample code: https://github.com/onetcenter/web-services-samples