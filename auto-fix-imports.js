const fs = require('fs');

const simpleReactRemoval = [
  'src/components/FormHeader.tsx',
  'src/components/ImageProcessingDialog.tsx',
  'src/components/LoginHeader.tsx',
  'src/components/SecurityAchievementSummary.tsx',
  'src/components/SecurityDocumentation.tsx',
  'src/components/SecurityFeaturesSummary.tsx',
  'src/components/SecurityImplementationSummary.tsx',
  'src/components/SimpleToaster.tsx',
  'src/components/SubmitButtons.tsx',
  'src/pages/AssetEntry.tsx',
  'src/pages/DailyReport.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/OtherAssets.tsx',
  'src/pages/PushNotificationTest.tsx'
];

const reactWithHooksRemoval = [
  'src/components/PushNotificationTester.tsx',
  'src/components/PWATestPanel.tsx',
  'src/components/ResendAPIChecker.tsx',
  'src/components/ResendSetupGuide.tsx',
  'src/components/SecurityDashboard.tsx',
  'src/components/SecurityTestPanel.tsx',
  'src/components/SecurityWorkflowDemo.tsx',
  'src/components/TestDataButton.tsx',
  'src/components/VAPIDKeyTester.tsx',
  'src/pages/Notifications.tsx'
];

const contextFiles = [
  'src/contexts/AuthContext.tsx',
  'src/contexts/ThemeContext.tsx'
];

// Fix simple React imports
simpleReactRemoval.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import React from 'react';\s*\n/, '');
    fs.writeFileSync(file, content);
    console.log(`Fixed simple React import: ${file}`);
  }
});

// Fix React with hooks imports
reactWithHooksRemoval.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import React, { ([^}]+) } from 'react';\s*\n/, 'import { $1 } from \'react\';\n');
    fs.writeFileSync(file, content);
    console.log(`Fixed React with hooks: ${file}`);
  }
});

// Fix context files
contextFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import React, { ([^}]+) } from 'react';\s*\n/, 'import { $1 } from \'react\';\n');
    fs.writeFileSync(file, content);
    console.log(`Fixed context file: ${file}`);
  }
});

// Specific fixes
const specificFixes = {
  'src/components/NotificationBell.tsx': (content) => {
    return content.replace(/Filter, /, '');
  },
  'src/components/ResendAPIChecker.tsx': (content) => {
    return content.replace(/Eye, EyeOff, /, '');
  },
  'src/components/RoomSelection.tsx': (content) => {
    content = content.replace(/import { Input } from '@\/components\/ui\/input';\s*\n/, '');
    content = content.replace(/import { AssetEntryFormState } from '@\/types\/assetEntryFormState';\s*\n/, '');
    return content;
  },
  'src/components/SecurityAchievementSummary.tsx': (content) => {
    return content.replace(/, Workflow/, '');
  },
  'src/components/SecurityImplementationSummary.tsx': (content) => {
    return content.replace(/const partialPercentage = Math\.round\(\(partialItems \/ totalItems\) \* 100\);\s*\n/, '');
  },
  'src/components/SecurityWorkflowDemo.tsx': (content) => {
    content = content.replace(/import { Button } from '@\/components\/ui\/button';\s*\n/, '');
    content = content.replace(/const \[currentStep, setCurrentStep\] = useState\(1\);\s*\n/, '');
    content = content.replace(/const \[userType, setUserType\] = useState<'user' \| 'admin'>\('user'\);\s*\n/, '');
    content = content.replace(/const getWorkflow = \(\) => {[^}]+};\s*\n/s, '');
    content = content.replace(/const getStepStatus = \([^)]*step: number[^)]*\) => {/, 'const getStepStatus = (status: string) => {');
    return content;
  },
  'src/components/SubmitButtons.tsx': (content) => {
    return content.replace(/TestTube, /, '');
  },
  'src/components/TestDataButton.tsx': (content) => {
    return content.replace(/const TestDataButton = \({ onTestData }: TestDataButtonProps\) => {/, 'const TestDataButton = () => {');
  },
  'src/components/ui/calendar.tsx': (content) => {
    content = content.replace(/{ \.\.\._props }/, '{}');
    return content;
  },
  'src/hooks/useAssetHistory.ts': (content) => {
    return content.replace(/interface AssetHistory {[^}]+}\s*\n/s, '');
  },
  'src/hooks/useAssetReminderEmail.ts': (content) => {
    return content.replace(/StaffMember, /, '');
  },
  'src/hooks/useAssetSubmission.ts': (content) => {
    return content.replace(/const { savedTransactions, emailResult }/, 'const { emailResult }');
  },
  'src/hooks/useOtherAssets.ts': (content) => {
    content = content.replace(/import { supabase } from '@\/integrations\/supabase\/client';\s*\n/, '');
    content = content.replace(/import { useSecureAuth } from '@\/contexts\/AuthContext';\s*\n/, '');
    return content;
  },
  'src/pages/AssetEntry.tsx': (content) => {
    return content.replace(/import FormHeader from '@\/components\/FormHeader';\s*\n/, '');
  },
  'src/pages/AssetReminders.tsx': (content) => {
    content = content.replace(/currentUser,\s*\n/, '');
    content = content.replace(/exportToCSV\s*\n/, '');
    content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);\s*\n/, '');
    return content;
  },
  'src/pages/CRCReminders.tsx': (content) => {
    content = content.replace(/const \[currentUser, setCurrentUser\] = useState<{ role: string; username: string } \| null>\(null\);\s*\n/, '');
    content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\); \/\/ Added\s*\n/, '');
    return content;
  },
  'src/pages/DataManagement.tsx': (content) => {
    content = content.replace(/Trophy, /, '');
    content = content.replace(/Mail, /, '');
    content = content.replace(/TestTube, /, '');
    content = content.replace(/TabsContent, /, '');
    return content;
  },
  'src/pages/Login.tsx': (content) => {
    return content.replace(/import { supabase } from '@\/integrations\/supabase\/client';\s*\n/, '');
  },
  'src/pages/Notifications.tsx': (content) => {
    content = content.replace(/import { Separator } from '@\/components\/ui\/separator';\s*\n/, '');
    content = content.replace(/const \[isReplying, setIsReplying\] = useState\(false\);\s*\n/, '');
    return content;
  }
};

// Apply specific fixes
Object.entries(specificFixes).forEach(([file, fixFunction]) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = fixFunction(content);
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log(`Applied specific fix: ${file}`);
    }
  }
});

console.log('🎉 All imports fixed automatically!');