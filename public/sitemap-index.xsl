<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <html>
      <head>
        <title>PropertPro Sitemap</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            margin: 0;
            font-size: 2em;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .navigation {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .navigation h2 {
            margin-top: 0;
            color: #2563eb;
          }
          .nav-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .nav-link {
            display: block;
            padding: 12px 15px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            text-decoration: none;
            color: #2563eb;
            transition: all 0.2s;
          }
          .nav-link:hover {
            background: #e3f2fd;
            border-color: #2563eb;
            transform: translateX(5px);
          }
          .sitemap-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .sitemap-list h2 {
            margin-top: 0;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
          }
          tr:hover {
            background-color: #f8f9fa;
          }
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 500;
          }
          .badge-high {
            background-color: #d1fae5;
            color: #065f46;
          }
          .badge-medium {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .badge-low {
            background-color: #f3f4f6;
            color: #374151;
          }
          .footer {
            margin-top: 30px;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
          }
          .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.2s;
          }
          .back-link:hover {
            background: #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🗺️ PropertPro Sitemap</h1>
          <p>Complete site structure and navigation</p>
        </div>
        
        <div class="navigation">
          <h2>📋 Sitemap Index</h2>
          <div class="nav-links">
            <a href="/sitemap-static.xml" class="nav-link">📄 Static Pages</a>
            <a href="/sitemap-properties.xml" class="nav-link">🏠 Property Listings</a>
            <a href="/sitemap-profiles.xml" class="nav-link">👤 User Profiles</a>
            <a href="/sitemap-locations.xml" class="nav-link">📍 Location Pages</a>
            <a href="/sitemap-developers.xml" class="nav-link">🏢 Developers & Projects</a>
            <a href="/sitemap" class="nav-link">🎨 Visual Sitemap Viewer</a>
            <a href="/" class="nav-link">🏡 Homepage</a>
          </div>
        </div>
        
        <div class="sitemap-list">
          <h2>Sub-Sitemaps</h2>
          <table>
            <thead>
              <tr>
                <th>Sitemap</th>
                <th>Last Modified</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                <tr>
                  <td>
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <a href="{sitemap:loc}" class="badge badge-medium">View</a>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>For search engines: Submit <a href="/sitemap.xml">/sitemap.xml</a> to Google Search Console</p>
          <a href="/" class="back-link">← Back to Homepage</a>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

