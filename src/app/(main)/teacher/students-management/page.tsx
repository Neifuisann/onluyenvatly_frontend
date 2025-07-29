"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/stores/auth";

// Mock data for students
const mockStudents = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0123456789",
    class: "12A1",
    joinDate: "2024-01-15",
    status: "active",
    progress: 85,
    completedLessons: 12,
    totalLessons: 15,
    lastActivity: "2024-01-20",
    avatar: null,
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "tranthibinh@email.com",
    phone: "0987654321",
    class: "12A2",
    joinDate: "2024-01-10",
    status: "active",
    progress: 92,
    completedLessons: 14,
    totalLessons: 15,
    lastActivity: "2024-01-21",
    avatar: null,
  },
  {
    id: 3,
    name: "Lê Minh Cường",
    email: "leminhcuong@email.com",
    phone: "0369852147",
    class: "12B1",
    joinDate: "2024-01-08",
    status: "inactive",
    progress: 45,
    completedLessons: 7,
    totalLessons: 15,
    lastActivity: "2024-01-18",
    avatar: null,
  },
  {
    id: 4,
    name: "Phạm Thu Dung",
    email: "phamthudung@email.com",
    phone: "0741852963",
    class: "12A1",
    joinDate: "2024-01-12",
    status: "active",
    progress: 78,
    completedLessons: 11,
    totalLessons: 15,
    lastActivity: "2024-01-21",
    avatar: null,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-red-100 text-red-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Hoạt động";
    case "inactive":
      return "Không hoạt động";
    case "pending":
      return "Chờ duyệt";
    default:
      return "Không xác định";
  }
};

export default function TeacherStudentsManagementPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [filteredStudents, setFilteredStudents] = useState(mockStudents);

  // Get unique classes
  const classes = Array.from(
    new Set(mockStudents.map((student) => student.class)),
  );

  useEffect(() => {
    let filtered = mockStudents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.class.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by class
    if (selectedClass !== "all") {
      filtered = filtered.filter((student) => student.class === selectedClass);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (student) => student.status === selectedStatus,
      );
    }

    setFilteredStudents(filtered);
  }, [searchTerm, selectedClass, selectedStatus]);

  const handleAddStudent = () => {
    // TODO: Implement add student functionality
    console.log("Add new student");
  };

  const handleViewStudent = (id: number) => {
    // TODO: Implement view student details
    console.log("View student", id);
  };

  const handleEditStudent = (id: number) => {
    // TODO: Implement edit student functionality
    console.log("Edit student", id);
  };

  const handleDeleteStudent = (id: number) => {
    // TODO: Implement delete student functionality
    console.log("Delete student", id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">
            Quản lý học sinh
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi và quản lý tiến độ học tập của học sinh
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tổng học sinh
                  </p>
                  <p className="text-2xl font-bold">{mockStudents.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Đang hoạt động
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockStudents.filter((s) => s.status === "active").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tiến độ trung bình
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      mockStudents.reduce((acc, s) => acc + s.progress, 0) /
                        mockStudents.length,
                    )}
                    %
                  </p>
                </div>
                <Award className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Số lớp</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {classes.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả lớp</option>
              {classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </div>

          {/* Add Student Button */}
          <Button
            onClick={handleAddStudent}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Thêm học sinh
          </Button>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Học sinh</th>
                    <th className="text-left py-3 px-4">Lớp</th>
                    <th className="text-left py-3 px-4">Liên hệ</th>
                    <th className="text-left py-3 px-4">Tiến độ</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Hoạt động cuối</th>
                    <th className="text-right py-3 px-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">
                              ID: {student.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{student.class}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                            <span>{student.progress}%</span>
                          </div>
                          <p className="text-gray-500">
                            {student.completedLessons}/{student.totalLessons}{" "}
                            bài
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(student.status)}>
                          {getStatusText(student.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(student.lastActivity)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu
                          trigger={
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                          align="end"
                        >
                          <DropdownMenuItem
                            onClick={() => handleViewStudent(student.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditStudent(student.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteStudent(student.id)}
                            destructive
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Không tìm thấy học sinh
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </p>
                <Button onClick={handleAddStudent}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Thêm học sinh đầu tiên
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
