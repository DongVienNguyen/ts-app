import Layout from '@/components/Layout';
import PushNotificationTester from '@/components/PushNotificationTester';

const PushNotificationTest = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔔 Test Push Notifications
            </h1>
            <p className="text-gray-600">
              Kiểm tra và cấu hình thông báo đẩy cho hệ thống
            </p>
          </div>
          
          <PushNotificationTester />
        </div>
      </div>
    </Layout>
  );
};

export default PushNotificationTest;