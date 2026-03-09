import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Edit, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { rooms, works as allWorks } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { WorkCard } from '../components/WorkCard';
import { getFirstImage } from '../utils/imageHelper';

export default function RoomDetail() {
  const { id } = useParams();
  const room = rooms.find(r => r.id === id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [guestbookText, setGuestbookText] = useState('');

  if (!room) {
    return <div>전시룸을 찾을 수 없습니다.</div>;
  }

  const forSaleWorks = room.works.filter(w => w.isForSale);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? room.works.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === room.works.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 전시룸 헤더 */}
      <div className="relative h-[400px] overflow-hidden bg-muted">
        <ImageWithFallback
          src={imageUrls[room.cover]}
          alt={room.title}
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-[1440px] px-6 pb-8">
            <h1 className="mb-3 text-4xl font-semibold text-white">{room.title}</h1>
            <p className="mb-4 max-w-2xl text-lg text-white/90">{room.description}</p>
            
            <div className="flex items-center justify-between">
              <Link to={`/profile/${room.artistId}`} className="flex items-center gap-3 group">
                <Avatar className="h-12 w-12 ring-2 ring-white">
                  <AvatarImage src={room.artist.avatar} alt={room.artist.name} />
                  <AvatarFallback>{room.artist.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white group-hover:text-white/80 transition-colors">
                    {room.artist.name}
                  </div>
                  <div className="text-sm text-white/70">
                    조회 {room.views.toLocaleString()} · 방문 {room.visitors}명
                  </div>
                </div>
              </Link>

              <Button variant="secondary" className="gap-2">
                <Share2 className="h-4 w-4" />
                공유
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <Tabs defaultValue="works" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="works">작품 ({room.works.length})</TabsTrigger>
            <TabsTrigger value="guestbook">방명록</TabsTrigger>
            <TabsTrigger value="qna">Q&A</TabsTrigger>
            {forSaleWorks.length > 0 && (
              <TabsTrigger value="purchase">소장하기 ({forSaleWorks.length})</TabsTrigger>
            )}
          </TabsList>

          {/* 작품 탭 */}
          <TabsContent value="works">
            <div className="grid grid-cols-3 gap-8">
              {room.works.map((work, index) => (
                <div
                  key={work.id}
                  className="cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-white flex items-center justify-center">
                    <ImageWithFallback
                      src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                      alt={work.title}
                      className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="mt-3">
                    <h3 className="font-medium">{work.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 방명록 탭 */}
          <TabsContent value="guestbook">
            <div className="mx-auto max-w-3xl space-y-6">
              {/* 방명록 작성 */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 font-medium">방명록 남기기</h3>
                <Textarea
                  placeholder="작품에 대한 감상을 남겨주세요..."
                  className="mb-3"
                  rows={4}
                  value={guestbookText}
                  onChange={(e) => setGuestbookText(e.target.value)}
                />
                <Button>작성하기</Button>
              </div>

              {/* 방명록 목록 */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border bg-card p-6">
                    <div className="mb-3 flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={room.artist.avatar} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">방문자 {i}</div>
                        <div className="text-sm text-muted-foreground">2일 전</div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">
                      정말 아름다운 작품이었습니다. 특히 빛의 표현이 인상 깊었어요.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Q&A 탭 */}
          <TabsContent value="qna">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-medium">질문하기</h3>
                <Button>질문 작성</Button>
              </div>

              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                아직 질문이 없습니다. 첫 번째 질문을 남겨보세요!
              </div>
            </div>
          </TabsContent>

          {/* 소장하기 탭 */}
          {forSaleWorks.length > 0 && (
            <TabsContent value="purchase">
              <div className="grid grid-cols-4 gap-6">
                {forSaleWorks.map((work) => (
                  <WorkCard key={work.id} work={work} showSaleBadge />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* 라이트박스 모달 */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] p-0 bg-black">
          <VisuallyHidden>
            <DialogTitle>작품 이미지</DialogTitle>
            <DialogDescription>
              {room.works[lightboxIndex].title} - {lightboxIndex + 1} / {room.works.length}
            </DialogDescription>
          </VisuallyHidden>
          <div className="relative h-full flex items-center justify-center">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 text-white hover:bg-white/10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* 이전 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            {/* 이미지 */}
            <div className="relative h-full w-full flex items-center justify-center p-16">
              <ImageWithFallback
                src={imageUrls[getFirstImage(room.works[lightboxIndex].image)] || getFirstImage(room.works[lightboxIndex].image)}
                alt={room.works[lightboxIndex].title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* 다음 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* 작품 정보 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h3 className="text-xl font-medium">{room.works[lightboxIndex].title}</h3>
              <p className="text-sm text-white/70">
                {lightboxIndex + 1} / {room.works.length}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}