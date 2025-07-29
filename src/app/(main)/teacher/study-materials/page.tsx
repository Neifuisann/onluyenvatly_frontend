"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth";

// Mock data for study materials
const mockStudyMaterials = [
  {
    id: 1,
    title: "Chương 1: Dao động cơ học",
    type: "pdf",
    description: "Tài liệu lý thuyết về dao động cơ học với các ví dụ minh họa",
    size: "2.5 MB",
    downloads: 45,
    views: 120,
    createdAt: "2024-01-15",
    tags: ["Dao động", "Cơ học"],
  },
  {
    id: 2,
    title: "Video bài giảng: Sóng âm",
    type: "video",
    description:
      "Video giải thích chi tiết về sóng âm và các hiện tượng liên quan",
    size: "125 MB",
    downloads: 32,
    views: 89,
    createdAt: "2024-01-10",
    tags: ["Sóng", "Âm học"],
  },
  {
    id: 3,
    title: "Hình ảnh minh họa: Quang học",
    type: "image",
    description: "Bộ sưu tập hình ảnh minh họa các hiện tượng quang học",
    size: "15.2 MB",
    downloads: 67,
    views: 156,
    createdAt: "2024-01-08",
    tags: ["Quang học", "Hình ảnh"],
  },
  {
    id: 4,
    title: "Bài tập thực hành: Điện học",
    type: "document",
    description:
      "Tập hợp các bài tập thực hành về điện học có lời giải chi tiết",
    size: "1.8 MB",
    downloads: 78,
    views: 203,
    createdAt: "2024-01-05",
    tags: ["Điện học", "Bài tập"],
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "document":
      return <FileText className="h-5 w-5" />;
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
    default:
      return <File className="h-5 w-5" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "pdf":
    case "document":
      return "bg-red-100 text-red-700";
    case "image":
      return "bg-green-100 text-green-700";
    case "video":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function TeacherStudyMaterialsPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [filteredMaterials, setFilteredMaterials] =
    useState(mockStudyMaterials);

  useEffect(() => {
    let filtered = mockStudyMaterials;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          material.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((material) => material.type === selectedType);
    }

    setFilteredMaterials(filtered);
  }, [searchTerm, selectedType]);

  const handleUpload = () => {
    // TODO: Implement file upload functionality
    console.log("Upload new material");
  };

  const handleEdit = (id: number) => {
    // TODO: Implement edit functionality
    console.log("Edit material", id);
  };

  const handleDelete = (id: number) => {
    // TODO: Implement delete functionality
    console.log("Delete material", id);
  };

  const handleDownload = (id: number) => {
    // TODO: Implement download functionality
    console.log("Download material", id);
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
            Quản lý tài liệu học tập
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý và chia sẻ tài liệu học tập cho học sinh
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="pdf">PDF</option>
              <option value="document">Tài liệu</option>
              <option value="image">Hình ảnh</option>
              <option value="video">Video</option>
            </select>
          </div>

          {/* Upload Button */}
          <Button onClick={handleUpload} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tải lên tài liệu
          </Button>
        </div>

        {/* Materials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(material.type)}
                      <Badge className={getTypeColor(material.type)}>
                        {material.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {material.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {material.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{material.size}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {material.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {material.downloads}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(material.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Tải xuống
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Không tìm thấy tài liệu
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button onClick={handleUpload}>
              <Plus className="h-4 w-4 mr-2" />
              Tải lên tài liệu đầu tiên
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
