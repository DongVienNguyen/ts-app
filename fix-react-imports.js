const fs = require('fs');
const path = require('path');

// List of files that need React import removed
const filesToFix = [
  'src/components/data-management/AdminEmailSettings.tsx',
  'src/components/DirectEmailTester.tsx',
  'src/components/EmailDebugPanel.tsx',
  'src/components/EmailTestButton.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/ForceCreateAdminButton.tsx',
  'src/components/FormHeader.tsx',
  'src/components/ImageProcessingDialog.tsx',
  'src/components/LoginHeader.tsx',
  'src/components/PushNotificationTester.tsx',
  'src/components/PWATestPanel.tsx',
  'src/components/ResendAPIChecker.tsx',
  'src/components/ResendSetupGuide.tsx',
  'src/components/RoomSelection.tsx',
  'src/components/SecurityAchievementSummary.tsx',
  'src/components/SecurityDashboard.tsx',
  'src/components/SecurityDocumentation.tsx',
  'src/components/SecurityFeaturesSummary.tsx',
  'src/components/SecurityImplementationSummary.tsx',
  'src/components/SecurityTestPanel.tsx',
  'src/components/SecurityWorkflowDemo.tsx',
  'src/components/SimpleToaster.tsx',
  'src/components/SubmitButtons.tsx',
  'src/components/TestDataButton.tsx',
  'src/components/VAPIDKeyTester.tsx',
  'src/contexts/AuthContext.tsx',
  'src/contexts/ThemeContext.tsx',
  'src/pages/AssetEntry.tsx',
  'src/pages/BorrowReport.tsx',
  'src/pages/DailyReport.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/Notifications.tsx',
  'src/pages/OtherAssets.tsx',
  'src/pages/PushNotificationTest.tsx'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove unused React import
    content = content.replace(/import React(,\s*{[^}]*})?\s*from\s*['"]react['"];\s*\n/, (match, namedImports) => {
      if (namedImports) {
        // Keep named imports, remove React
        return `import${namedImports} from 'react';\n`;
      }
      return '';
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
});

console.log('All React imports fixed!');