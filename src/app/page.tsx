import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Users, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Ôn Luyện Vật Lý Lớp 12
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Nền tảng học tập vật lý trực tuyến với bài giảng tương tác, 
            quiz thông minh và theo dõi tiến độ học tập
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login">Bắt đầu học</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Đăng ký miễn phí</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tính năng nổi bật
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Bài học tương tác</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Hệ thống bài học được thiết kế khoa học, dễ hiểu với nhiều 
                  ví dụ minh họa sinh động
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Quiz thông minh</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Câu hỏi được mã hóa an toàn, phân tích chi tiết từng đáp án 
                  giúp học sinh hiểu sâu kiến thức
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Gamification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Hệ thống điểm thưởng, thành tích và bảng xếp hạng giúp 
                  học tập trở nên thú vị hơn
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Theo dõi tiến độ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Thống kê chi tiết giúp học sinh và phụ huynh theo dõi 
                  tiến độ học tập hiệu quả
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Sẵn sàng nâng cao kiến thức Vật lý?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Tham gia cùng hàng nghìn học sinh đang học tập hiệu quả trên nền tảng của chúng tôi
          </p>
          <Button asChild size="lg">
            <Link href="/register">Đăng ký ngay</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
