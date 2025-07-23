'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminLogin, useStudentLogin } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const adminSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

const studentSchema = z.object({
  phone_number: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

type AdminFormData = z.infer<typeof adminSchema>;
type StudentFormData = z.infer<typeof studentSchema>;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('student');
  const adminLogin = useAdminLogin();
  const studentLogin = useStudentLogin();

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  });

  const onAdminSubmit = (data: AdminFormData) => {
    adminLogin.mutate(data);
  };

  const onStudentSubmit = (data: StudentFormData) => {
    // Get device info for student login
    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    studentLogin.mutate({ ...data, deviceInfo });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>
          Chọn loại tài khoản và đăng nhập vào hệ thống
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Học sinh</TabsTrigger>
            <TabsTrigger value="admin">Quản trị viên</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student" className="space-y-4">
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                <FormField
                  control={studentForm.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="0987654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={studentForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={studentLogin.isPending}
                >
                  {studentLogin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đăng nhập
                </Button>
              </form>
            </Form>
            <div className="text-center text-sm">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-4">
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                <FormField
                  control={adminForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={adminLogin.isPending}
                >
                  {adminLogin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đăng nhập
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}