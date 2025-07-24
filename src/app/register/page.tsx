'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { Mail, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

type RegistrationMethod = 'google' | 'facebook' | 'email' | 'phone' | null;

const phoneRegisterSchema = z.object({
  full_name: z.string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không được quá 50 ký tự')
    .regex(/^[a-zA-ZÀ-ỹ\s]{2,50}$/, 'Họ tên chỉ được chứa chữ cái và khoảng trắng'),
  phone_number: z.string()
    .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

type PhoneRegisterForm = z.infer<typeof phoneRegisterSchema>;

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;
  const strengthPercentage = (strength / 5) * 100;
  
  const strengthColor = strength < 2 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          data-testid="password-strength-bar"
          className={`h-full ${strengthColor} password-strength-bar`}
          initial={{ width: 0 }}
          animate={{ width: `${strengthPercentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      <div className="space-y-1 text-sm">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {hasUpperCase ? <BsCheckCircleFill className="text-green-500" /> : <BsXCircleFill className="text-gray-400" />}
          <span className={hasUpperCase ? 'text-green-700' : 'text-gray-500'}>Chữ hoa</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {hasLowerCase ? <BsCheckCircleFill className="text-green-500" /> : <BsXCircleFill className="text-gray-400" />}
          <span className={hasLowerCase ? 'text-green-700' : 'text-gray-500'}>Chữ thường</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {hasNumber ? <BsCheckCircleFill className="text-green-500" /> : <BsXCircleFill className="text-gray-400" />}
          <span className={hasNumber ? 'text-green-700' : 'text-gray-500'}>Số</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {hasSpecialChar ? <BsCheckCircleFill className="text-green-500" /> : <BsXCircleFill className="text-gray-400" />}
          <span className={hasSpecialChar ? 'text-green-700' : 'text-gray-500'}>Ký tự đặc biệt (!@#$%^&*)</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<RegistrationMethod>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const form = useForm<PhoneRegisterForm>({
    resolver: zodResolver(phoneRegisterSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PhoneRegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.studentRegister({
        full_name: data.full_name,
        phone_number: data.phone_number,
        password: data.password,
      });
      
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (method: RegistrationMethod) => {
    setSelectedMethod(method);
  };

  const registrationMethods = [
    {
      id: 'google',
      name: 'Đăng ký với Google',
      icon: FaGoogle,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
    {
      id: 'facebook',
      name: 'Đăng ký với Facebook',
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full px-4">
        <Card className="w-full shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Chọn phương thức đăng ký phù hợp với bạn
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
                {registrationMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    className={`w-full h-12 justify-start px-4 ${method.bgColor} ${method.textColor} border ${method.borderColor} transition-all duration-200`}
                    onClick={() => handleMethodSelect(method.id as RegistrationMethod)}
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Nguyễn Văn A"
                              disabled={isLoading}
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="0987654321"
                              disabled={isLoading}
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>mật khẩu</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                disabled={isLoading}
                                className="h-12 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          {field.value && <PasswordStrengthIndicator password={field.value} />}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nhập lại mật khẩu</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Xác nhận mật khẩu"
                                disabled={isLoading}
                                className="h-12 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-600 text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đăng ký
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
            Đã có tài khoản?{' '}
            <Link 
              href="/login" 
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}