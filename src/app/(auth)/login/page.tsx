'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStudentLogin } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth';
import { extractErrorMessage, getErrorHelp } from '@/lib/utils/errorHandler';
import { Loader2, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';

const phoneSchema = z.object({
  phone_number: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

type SignInMethod = 'phone' | 'email' | 'google' | 'facebook' | null;

export default function LoginPage() {
  const [selectedMethod, setSelectedMethod] = useState<SignInMethod>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [errorHelp, setErrorHelp] = useState<string | null>(null);
  const studentLogin = useStudentLogin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { user } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  });

  // Generate device ID on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = btoa(
        `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`
      ).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      setDeviceId(id);
    }
  }, []);

  const onPhoneSubmit = async (data: PhoneFormData) => {
    // Clear previous errors
    setError(null);
    setErrorHelp(null);
    
    // Ensure device ID is available before submitting
    if (!deviceId) {
      setError('Không thể xác định thiết bị. Vui lòng tải lại trang.');
      return;
    }
    
    studentLogin.mutate(
      { ...data, deviceId },
      {
        onSuccess: () => {
          router.push(returnUrl);
        },
        onError: (err) => {
          const errorMessage = extractErrorMessage(err);
          setError(errorMessage);
          
          const helpMessage = getErrorHelp(errorMessage);
          if (helpMessage) {
            setErrorHelp(helpMessage);
          }
        }
      }
    );
  };

  const handleMethodSelect = (method: SignInMethod) => {
    setSelectedMethod(method);
    setError(null);
    setErrorHelp(null);
  };

  const signInMethods = [
    {
      id: 'google',
      name: 'Đăng nhập với Google',
      icon: FaGoogle,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
    {
      id: 'facebook',
      name: 'Đăng nhập với Facebook',
      icon: FaFacebook,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
    {
      id: 'phone',
      name: 'Số điện thoại',
      icon: Phone,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
  ];

  return (
    <div data-testid="login-container" className="w-full">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
          <CardDescription>
            Chọn phương thức đăng nhập của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedMethod === null ? (
              <motion.div
                key="methods"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {signInMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    className={`w-full h-12 justify-start px-4 ${method.bgColor} ${method.textColor} border ${method.borderColor} transition-all duration-200`}
                    onClick={() => handleMethodSelect(method.id as SignInMethod)}
                  >
                    <method.icon className={`mr-3 h-5 w-5 ${method.id === 'facebook' ? 'text-blue-600' : method.id === 'google' ? 'text-gray-600' : 'text-gray-600'}`} />
                    {method.name}
                  </Button>
                ))}
              </motion.div>
            ) : selectedMethod === 'phone' ? (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                    <FormField
                      control={phoneForm.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0987654321" 
                              {...field} 
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={phoneForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-right">
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-600 font-medium">
                            {error}
                          </p>
                          {errorHelp && (
                            <p className="text-xs text-red-500 mt-1">
                              💡 {errorHelp}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      disabled={studentLogin.isPending || !deviceId}
                    >
                      {studentLogin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đăng nhập
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setSelectedMethod(null)}
                    >
                      Chọn phương thức khác
                    </Button>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="coming-soon"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-gray-500 mb-4">
                  Phương thức này sẽ sớm được hỗ trợ
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMethod(null)}
                >
                  Quay lại
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Hoặc</span>
            </div>
          </div>

          <div className="text-center text-sm">
            Chưa có tài khoản?{' '}
            <Link 
              href="/register" 
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}