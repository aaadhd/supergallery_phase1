import { useParams, Link } from 'react-router-dom';
import { Star, Users, Clock, BarChart } from 'lucide-react';
import { classes, works } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { WorkCard } from '../components/WorkCard';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';

export default function ClassDetail() {
  const { id } = useParams();
  const classData = classes.find(c => c.id === id);

  if (!classData) {
    return <div>클래스를 찾을 수 없습니다.</div>;
  }

  // 강사의 작품들
  const instructorWorks = works.filter(w => w.artistId === classData.instructor.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="grid grid-cols-3 gap-12">
          {/* 좌측: 이미지 및 커리큘럼 */}
          <div className="col-span-2 space-y-8">
            {/* 클래스 커버 */}
            <div className="overflow-hidden rounded-lg">
              <ImageWithFallback
                src={imageUrls[classData.cover]}
                alt={classData.title}
                className="aspect-video w-full object-cover"
              />
            </div>

            {/* 탭 컨텐츠 */}
            <Tabs defaultValue="curriculum" className="w-full">
              <TabsList>
                <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
                <TabsTrigger value="qna">질문 게시판</TabsTrigger>
                <TabsTrigger value="instructor">강사 소개</TabsTrigger>
              </TabsList>

              {/* 커리큘럼 */}
              <TabsContent value="curriculum" className="mt-6">
                <div className="space-y-4">
                  {classData.curriculum?.map((item, index) => (
                    <div key={index} className="flex gap-4 rounded-lg border bg-card p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item}</h4>
                        <p className="text-sm text-muted-foreground">
                          약 1시간 30분
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* 질문 게시판 */}
              <TabsContent value="qna" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">클래스 질문</h3>
                    <Button>질문하기</Button>
                  </div>
                  <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                    아직 질문이 없습니다. 첫 번째 질문을 남겨보세요!
                  </div>
                </div>
              </TabsContent>

              {/* 강사 소개 */}
              <TabsContent value="instructor" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={classData.instructor.avatar} alt={classData.instructor.name} />
                      <AvatarFallback>{classData.instructor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="mb-1 text-xl font-semibold">{classData.instructor.name}</h3>
                      <p className="text-muted-foreground">{classData.instructor.bio}</p>
                      <div className="mt-3 flex gap-4 text-sm">
                        <span>팔로워 {classData.instructor.followers?.toLocaleString()}</span>
                        <span>작품 {instructorWorks.length}개</span>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link to={`/profile/${classData.instructor.id}`}>
                          프로필 보기
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* 강사 작품 */}
                  <div>
                    <h4 className="mb-4 font-medium">강사의 작품</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {instructorWorks.map((work) => (
                        <WorkCard key={work.id} work={work} />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 우측: 클래스 정보 및 수강 신청 */}
          <div className="space-y-6">
            {/* 클래스 정보 카드 */}
            <div className="sticky top-24 space-y-6 rounded-lg border bg-card p-6">
              <div>
                <h1 className="mb-4 text-2xl font-semibold">{classData.title}</h1>
                
                {/* 통계 */}
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {classData.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {classData.students}명
                  </span>
                </div>

                {/* 가격 */}
                <div className="mb-6">
                  <div className="text-3xl font-bold">
                    ₩{classData.price.toLocaleString()}
                  </div>
                </div>

                {/* 수강 신청 버튼 */}
                <Button className="w-full" size="lg">
                  수강 신청하기
                </Button>
              </div>

              <Separator />

              {/* 클래스 특징 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BarChart className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">난이도</div>
                    <div className="text-sm text-muted-foreground">{classData.level}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">총 강의 시간</div>
                    <div className="text-sm text-muted-foreground">
                      약 6시간
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">수강생</div>
                    <div className="text-sm text-muted-foreground">
                      {classData.students}명이 수강 중
                    </div>
                  </div>
                </div>
              </div>

              {classData.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 font-medium">클래스 소개</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {classData.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
