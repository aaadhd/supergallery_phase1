import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, X, GripVertical, Grid, List, Save } from 'lucide-react';
import { rooms, works as allWorksStatic, artists } from '../data';
import { workStore, roomStore } from '../store';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { getFirstImage } from '../utils/imageHelper';

export default function RoomEdit() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  // 템플릿별 초기값 설정
  const getInitialTitle = () => {
    if (templateId === 'portfolio') return '김민서의 포트폴리오 전시';
    if (templateId === 'theme') return '계절의 조각들 (기획전)';
    if (templateId === 'return') return '다시 만나는 색채: 리턴전';
    return '새로운 전시룸';
  };

  const getInitialDesc = () => {
    if (templateId === 'portfolio') return '그동안 작업한 주요 작품들을 한눈에 볼 수 있는 전시입니다.';
    if (templateId === 'theme') return '특정 주제에 따라 선별된 작품들의 이야기입니다.';
    if (templateId === 'return') return '공백기 이후 새로운 영감을 담아 다시 선보이는 작품들입니다.';
    return '';
  };

  // roomStore 또는 정적 데이터에서 현재 룸을 찾음
  const existingRoom = roomId
    ? (roomStore.getRoom(roomId) || rooms.find(r => r.id === roomId))
    : undefined;

  const [title, setTitle] = useState(existingRoom ? existingRoom.title : getInitialTitle());
  const [description, setDescription] = useState(existingRoom ? existingRoom.description : getInitialDesc());
  const [layout, setLayout] = useState<'grid' | 'wall' | 'list'>('grid');
  // works가 Work[]인 경우 id 배열로 변환
  const [selectedWorks, setSelectedWorks] = useState<string[]>(
    existingRoom ? (existingRoom.works as any[]).map((w: any) => typeof w === 'string' ? w : w.id) : []
  );
  const [modalOpen, setModalOpen] = useState(false);

  // 작품 목록: workStore(+ 정적 데이터) 통합
  const [storeWorks, setStoreWorks] = useState(workStore.getWorks());
  useEffect(() => {
    const unsub = workStore.subscribe(() => setStoreWorks(workStore.getWorks()));
    return unsub;
  }, []);

  const currentUserId = artists[0].id;
  // 내 작품: workStore 기준 (+ 없으면 정적 앱 6개 폴백)
  const myWorks = storeWorks.filter(w => w.artistId === currentUserId).length > 0
    ? storeWorks.filter(w => w.artistId === currentUserId)
    : allWorksStatic.slice(0, 6);

  const toggleWork = (workId: string) => {
    setSelectedWorks(prev =>
      prev.includes(workId)
        ? prev.filter(id => id !== workId)
        : [...prev, workId]
    );
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert('전시룸 제목을 입력해주세요.');
      return;
    }
    if (selectedWorks.length === 0) {
      alert('최소 1개 이상의 작품을 추가해주세요.');
      return;
    }

    // 선택된 작품 Work[] 복원
    const selectedWorkObjects = selectedWorks
      .map(id => storeWorks.find(w => w.id === id) || allWorksStatic.find(w => w.id === id))
      .filter(Boolean) as any[];

    if (existingRoom && roomStore.getRoom(existingRoom.id)) {
      // 기존 room 업데이트
      roomStore.updateRoom(existingRoom.id, {
        title: title.trim(),
        description,
        works: selectedWorkObjects,
      });
      alert(`"${title}" 전시룸가 수정되었습니다!`);
    } else {
      // 새 room 생성
      const newRoom = {
        id: `room_${Date.now()}`,
        title: title.trim(),
        description,
        cover: selectedWorkObjects[0] ? getFirstImage(selectedWorkObjects[0].image) : '',
        artistId: currentUserId,
        artist: artists[0],
        works: selectedWorkObjects,
        views: 0,
        visitors: 0,
      };
      roomStore.addRoom(newRoom);
      alert(`"${title}" 전시룸가 성공적으로 공개되었습니다!`);
    }
    navigate('/rooms');
  };

  // 마지막 선택된 작품 Work 객체 목록
  const allAvailableWorks = [...storeWorks, ...allWorksStatic.filter(w => !storeWorks.find(s => s.id === w.id))];

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-2 gap-8 h-screen">
        {/* 좌측 패널: 편집 */}
        <div className="border-r bg-white p-8 overflow-y-auto">
          <div className="mx-auto max-w-xl space-y-6">
            <div>
              <h1 className="mb-6 text-2xl font-semibold">전시룸 설정</h1>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">전시룸 제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="전시룸 제목을 입력하세요"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="전시룸에 대한 설명을 작성하세요"
                rows={4}
              />
            </div>

            {/* 레이아웃 선택 */}
            <div className="space-y-3">
              <Label>레이아웃</Label>
              <RadioGroup value={layout} onValueChange={(v) => setLayout(v as any)}>
                <div className="flex items-center space-x-3 rounded-lg border p-4">
                  <RadioGroupItem value="grid" id="grid" />
                  <Label htmlFor="grid" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <Grid className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">그리드</div>
                      <div className="text-sm text-muted-foreground">정돈된 그리드 레이아웃</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4">
                  <RadioGroupItem value="wall" id="wall" />
                  <Label htmlFor="wall" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <div className="h-5 w-5 rounded border-2 border-muted-foreground" />
                    <div>
                      <div className="font-medium">벽면</div>
                      <div className="text-sm text-muted-foreground">갤러리 벽면 느낌</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <List className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">리스트</div>
                      <div className="text-sm text-muted-foreground">세로 리스트 형태</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 작품 추가 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>선택된 작품 ({selectedWorks.length})</Label>
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      작품 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>작품 선택</DialogTitle>
                      <DialogDescription>전시룸에 추가할 작품을 선택하세요.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-4">
                      {myWorks.map((work) => (
                        <div key={work.id} className="space-y-2">
                          <div
                            className={`relative cursor-pointer rounded-lg overflow-hidden ${selectedWorks.includes(work.id) ? 'ring-2 ring-primary' : ''
                              }`}
                            onClick={() => toggleWork(work.id)}
                          >
                            <ImageWithFallback
                              src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                              alt={work.title}
                              className="aspect-square object-cover"
                            />
                            <div className="absolute right-2 top-2">
                              <Checkbox
                                checked={selectedWorks.includes(work.id)}
                                className="bg-white"
                              />
                            </div>
                          </div>
                          <p className="text-sm font-medium">{work.title}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setModalOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={() => setModalOpen(false)}>
                        선택 완료
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 선택된 작품 목록 */}
              {selectedWorks.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedWorks.map((workId) => {
                    const work = allAvailableWorks.find(w => w.id === workId);
                    if (!work) return null;
                    return (
                      <div key={workId} className="relative group">
                        <ImageWithFallback
                          src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                          alt={work.title}
                          className="aspect-square rounded-lg object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => toggleWork(workId)}
                        >
                          제거
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-6">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/rooms')}>
                취소
              </Button>
              <Button className="flex-1 gap-2" onClick={handlePublish}>
                <Save className="h-4 w-4" />
                공개하기
              </Button>
            </div>
          </div>
        </div>

        {/* 우측 패널: 미리보기 */}
        <div className="bg-muted p-8 overflow-y-auto">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">미리보기</h2>
          </div>

          <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-semibold">{title}</h2>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>

            {selectedWorks.length > 0 ? (
              <div className={`grid gap-6 ${layout === 'grid' ? 'grid-cols-3' :
                layout === 'wall' ? 'grid-cols-2' :
                  'grid-cols-1'
                }`}>
                {selectedWorks.map((workId) => {
                  const work = allAvailableWorks.find(w => w.id === workId);
                  if (!work) return null;
                  return (
                    <div key={workId} className="space-y-2">
                      <div className={`overflow-hidden rounded-lg ${layout === 'wall' ? 'aspect-[3/4]' : 'aspect-square'
                        }`}>
                        <ImageWithFallback
                          src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                          alt={work.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="font-medium">{work.title}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                작품을 추가하여 전시룸을 구성해보세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}