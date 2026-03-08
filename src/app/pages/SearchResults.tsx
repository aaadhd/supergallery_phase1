import { useSearchParams, useNavigate } from 'react-router-dom';
import { rooms, artists, classes } from '../data';
import { workStore } from '../store';
import { useState, useEffect } from 'react';
import { WorkCard } from '../components/WorkCard';
import { RoomCard } from '../components/RoomCard';
import { ClassCard } from '../components/ClassCard';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  // workStore 구독 — 새로 업로드한 작품도 검색 결과에 포함
  const [allWorks, setAllWorks] = useState(workStore.getWorks());
  useEffect(() => {
    const unsub = workStore.subscribe(() => setAllWorks(workStore.getWorks()));
    return unsub;
  }, []);

  // 검색 필터
  const searchWorks = allWorks.filter(w =>
    w.title.toLowerCase().includes(query.toLowerCase()) ||
    w.artist?.name.toLowerCase().includes(query.toLowerCase())
  );


  const searchRooms = rooms.filter(r =>
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.artist.name.toLowerCase().includes(query.toLowerCase())
  );

  const searchArtists = artists.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const searchClasses = classes.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.instructor.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalResults = searchWorks.length + searchRooms.length + searchArtists.length + searchClasses.length;

  return (
    <div className="min-h-screen bg-background">
      {/* 검색 결과 헤더 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-8">
          <h1 className="text-3xl font-semibold">
            "{query}" 검색 결과
          </h1>
          <p className="mt-2 text-muted-foreground">
            총 {totalResults}개의 결과를 찾았습니다
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">전체 ({totalResults})</TabsTrigger>
            <TabsTrigger value="works">작품 ({searchWorks.length})</TabsTrigger>
            <TabsTrigger value="rooms">전시룸 ({searchRooms.length})</TabsTrigger>
            <TabsTrigger value="artists">작가 ({searchArtists.length})</TabsTrigger>
            <TabsTrigger value="classes">클래스 ({searchClasses.length})</TabsTrigger>
          </TabsList>

          {/* 전체 탭 */}
          <TabsContent value="all" className="mt-8">
            <div className="space-y-12">
              {/* 작가 */}
              {searchArtists.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-semibold">작가</h2>
                  <div className="grid grid-cols-4 gap-6">
                    {searchArtists.map((artist) => (
                      <div key={artist.id} className="rounded-lg border bg-card p-6 text-center">
                        <Avatar className="mx-auto mb-4 h-20 w-20">
                          <AvatarImage src={artist.avatar} alt={artist.name} />
                          <AvatarFallback className="text-xl">{artist.name[0]}</AvatarFallback>
                        </Avatar>
                        <h3 className="mb-2 font-semibold">{artist.name}</h3>
                        {artist.bio && (
                          <p className="mb-4 text-sm text-muted-foreground">{artist.bio}</p>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/profile/${artist.id}`)}>
                          프로필 보기
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 작품 */}
              {searchWorks.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-semibold">작품</h2>
                  <div className="grid grid-cols-4 gap-6">
                    {searchWorks.slice(0, 8).map((work) => (
                      <WorkCard key={work.id} work={work} />
                    ))}
                  </div>
                </section>
              )}

              {/* 전시룸 */}
              {searchRooms.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-semibold">전시룸</h2>
                  <div className="grid grid-cols-3 gap-8">
                    {searchRooms.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </section>
              )}

              {/* 클래스 */}
              {searchClasses.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-semibold">클래스</h2>
                  <div className="grid grid-cols-4 gap-6">
                    {searchClasses.map((cls) => (
                      <ClassCard key={cls.id} class={cls} />
                    ))}
                  </div>
                </section>
              )}

              {totalResults === 0 && (
                <div className="rounded-lg border bg-card p-12 text-center">
                  <p className="text-muted-foreground">
                    검색 결과가 없습니다. 다른 키워드로 검색해보세요.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 작품 탭 */}
          <TabsContent value="works" className="mt-8">
            {searchWorks.length > 0 ? (
              <div className="grid grid-cols-4 gap-6">
                {searchWorks.map((work) => (
                  <WorkCard key={work.id} work={work} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
                작품 검색 결과가 없습니다.
              </div>
            )}
          </TabsContent>

          {/* 전시룸 탭 */}
          <TabsContent value="rooms" className="mt-8">
            {searchRooms.length > 0 ? (
              <div className="grid grid-cols-3 gap-8">
                {searchRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
                전시룸 검색 결과가 없습니다.
              </div>
            )}
          </TabsContent>

          {/* 작가 탭 */}
          <TabsContent value="artists" className="mt-8">
            {searchArtists.length > 0 ? (
              <div className="grid grid-cols-4 gap-6">
                {searchArtists.map((artist) => (
                  <div key={artist.id} className="rounded-lg border bg-card p-6 text-center">
                    <Avatar className="mx-auto mb-4 h-20 w-20">
                      <AvatarImage src={artist.avatar} alt={artist.name} />
                      <AvatarFallback className="text-xl">{artist.name[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="mb-2 font-semibold">{artist.name}</h3>
                    {artist.bio && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{artist.bio}</p>
                    )}
                    <div className="mb-4 flex justify-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        팔로워 {artist.followers?.toLocaleString()}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/profile/${artist.id}`)}>
                      프로필 보기
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
                작가 검색 결과가 없습니다.
              </div>
            )}
          </TabsContent>

          {/* 클래스 탭 */}
          <TabsContent value="classes" className="mt-8">
            {searchClasses.length > 0 ? (
              <div className="grid grid-cols-4 gap-6">
                {searchClasses.map((cls) => (
                  <ClassCard key={cls.id} class={cls} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
                클래스 검색 결과가 없습니다.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
