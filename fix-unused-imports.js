const fs = require('fs');
const path = require('path');

// Files and their specific fixes
const fixes = [
  // Remove React imports
  {
    files: [
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
      'src/pages/DailyReport.tsx',
      'src/pages/NotFound.tsx',
      'src/pages/Notifications.tsx',
      'src/pages/OtherAssets.tsx',
      'src/pages/PushNotificationTest.tsx'
    ],
    fix: (content) => {
      // Remove React import but keep named imports
      return content.replace(/import React(,\s*{[^}]*})?\s*from\s*['"]react['"];\s*\n/, (match, namedImports) => {
        if (namedImports) {
          return `import${namedImports} from 'react';\n`;
        }
        return '';
      });
    }
  },
  
  // Specific icon removals
  {
    files: ['src/components/DirectEmailTester.tsx'],
    fix: (content) => content.replace(/Mail,\s*/, '')
  },
  
  {
    files: ['src/components/EmailDebugPanel.tsx'],
    fix: (content) => content.replace(/Eye,\s*/, '').replace(/const\s*{\s*data:\s*testData[^}]*}\s*=/, 'const { error: testError } =')
  },
  
  {
    files: ['src/components/ForceCreateAdminButton.tsx'],
    fix: (content) => content.replace(/UserPlus,\s*/, '')
  },
  
  {
    files: ['src/components/NotificationBell.tsx'],
    fix: (content) => content.replace(/Filter,\s*/, '')
  },
  
  {
    files: ['src/components/ResendAPIChecker.tsx'],
    fix: (content) => content.replace(/Eye,\s*EyeOff,\s*/, '')
  },
  
  {
    files: ['src/components/RoomSelection.tsx'],
    fix: (content) => content
      .replace(/import\s*{\s*Input\s*}\s*from\s*['"]@\/components\/ui\/input['"];\s*\n/, '')
      .replace(/import\s*{\s*AssetEntryFormState\s*}\s*from\s*['"]@\/types\/assetEntryFormState['"];\s*\n/, '')
  },
  
  {
    files: ['src/components/SecurityAchievementSummary.tsx'],
    fix: (content) => content.replace(/Workflow,?\s*/, '')
  },
  
  {
    files: ['src/components/SecurityImplementationSummary.tsx'],
    fix: (content) => content.replace(/const\s+partialPercentage\s*=\s*[^;]+;\s*\n/, '')
  },
  
  {
    files: ['src/components/SecurityWorkflowDemo.tsx'],
    fix: (content) => content
      .replace(/import\s*{\s*Button\s*}\s*from\s*['"]@\/components\/ui\/button['"];\s*\n/, '')
      .replace(/const\s*\[\s*currentStep,\s*setCurrentStep\s*\]\s*=\s*useState\(1\);\s*\n/, '')
      .replace(/const\s*\[\s*userType,\s*setUserType\s*\]\s*=\s*useState<[^>]+>\([^)]+\);\s*\n/, '')
      .replace(/const\s+getWorkflow\s*=\s*\(\)\s*=>\s*{[^}]+};\s*\n/, '')
      .replace(/const\s+getStepStatus\s*=\s*\([^)]*step:\s*number[^)]*\)\s*=>\s*{/, 'const getStepStatus = (status: string) => {')
  },
  
  {
    files: ['src/components/SubmitButtons.tsx'],
    fix: (content) => content.replace(/TestTube,\s*/, '')
  },
  
  {
    files: ['src/components/TestDataButton.tsx'],
    fix: (content) => content.replace(/const\s+TestDataButton\s*=\s*\(\s*{\s*onTestData\s*}[^)]*\)\s*=>/, 'const TestDataButton = () =>')
  },
  
  {
    files: ['src/components/ui/calendar.tsx'],
    fix: (content) => content
      .replace(/{\s*\.\.\._props\s*}/, '{}')
      .replace(/{\s*\.\.\._props\s*}/, '{}')
  },
  
  // Hook fixes
  {
    files: ['src/hooks/useAssetHistory.ts'],
    fix: (content) => content.replace(/interface\s+AssetHistory\s*{[^}]+}\s*\n/, '')
  },
  
  {
    files: ['src/hooks/useAssetReminderEmail.ts'],
    fix: (content) => content.replace(/StaffMember,\s*/, '')
  },
  
  {
    files: ['src/hooks/useAssetSubmission.ts'],
    fix: (content) => content.replace(/const\s*{\s*savedTransactions,/, 'const {')
  },
  
  {
    files: ['src/hooks/useOtherAssets.ts'],
    fix: (content) => content
      .replace(/import\s*{\s*supabase\s*}\s*from\s*['"]@\/integrations\/supabase\/client['"];\s*\n/, '')
      .replace(/import\s*{\s*useSecureAuth\s*}\s*from\s*['"]@\/contexts\/AuthContext['"];\s*\n/, '')
  },
  
  // Page fixes
  {
    files: ['src/pages/AssetEntry.tsx'],
    fix: (content) => content.replace(/import\s+FormHeader\s+from\s+['"]@\/components\/FormHeader['"];\s*\n/, '')
  },
  
  {
    files: ['src/pages/AssetReminders.tsx'],
    fix: (content) => content
      .replace(/currentUser,\s*\n/, '')
      .replace(/exportToCSV\s*\n/, '')
      .replace(/const\s*\[\s*searchTerm,\s*setSearchTerm\s*\]\s*=\s*useState\([^)]*\);\s*\n/, '')
  },
  
  {
    files: ['src/pages/CRCReminders.tsx'],
    fix: (content) => content
      .replace(/const\s*\[\s*currentUser,\s*setCurrentUser\s*\]\s*=\s*useState[^;]+;\s*\n/, '')
      .replace(/const\s*\[\s*searchTerm,\s*setSearchTerm\s*\]\s*=\s*useState\([^)]*\);\s*\n/, '')
  },
  
  {
    files: ['src/pages/DataManagement.tsx'],
    fix: (content) => content
      .replace(/Trophy,\s*/, '')
      .replace(/Mail,\s*/, '')
      .replace(/TestTube,\s*/, '')
      .replace(/TabsContent,\s*/, '')
  },
  
  {
    files: ['src/pages/Login.tsx'],
    fix: (content) => content.replace(/import\s*{\s*supabase\s*}\s*from\s*['"]@\/integrations\/supabase\/client['"];\s*\n/, '')
  },
  
  {
    files: ['src/pages/Notifications.tsx'],
    fix: (content) => content
      .replace(/import\s*{\s*Separator\s*}\s*from\s*['"]@\/components\/ui\/separator['"];\s*\n/, '')
      .replace(/const\s*\[\s*isReplying,\s*setIsReplying\s*\]\s*=\s*useState\([^)]*\);\s*\n/, '')
  }
];

// Apply fixes
fixes.forEach(({ files, fix }) => {
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const newContent = fix(content);
        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent);
          console.log(`✅ Fixed: ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
      }
    } else {
      console.warn(`⚠️  File not found: ${filePath}`);
    }
  });
});

console.log('🎉 All unused imports fixed!');