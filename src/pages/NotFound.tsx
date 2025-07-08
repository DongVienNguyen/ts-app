import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-6xl font-bold text-gray-400">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mt-2">
                Không tìm thấy trang
              </h2>
              <p className="text-gray-500 mt-2">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Button>
              <Button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Trang chủ</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;