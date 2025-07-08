import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import Layout from '@/components/Layout';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useSecureAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.department === "NQ") {
          navigate('/daily-report');
        } else {
          navigate('/asset-entry');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Chào mừng, {user.staff_name || user.username}!</h1>
        <p className="text-muted-foreground">
          Vai trò: {user.role} | Phòng ban: {user.department}
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng mới</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng mới</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng mới</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng mới</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng mới</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Đơn hàng mới</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;