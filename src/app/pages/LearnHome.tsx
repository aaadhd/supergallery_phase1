import { useState } from 'react';
import { ClassCard } from '../components/ClassCard';
import { classes } from '../data';
import { Badge } from '../components/ui/badge';

export default function LearnHome() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['전체', '기초', '색감', '인물', '풍경', '툴팁'];

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-8">
          <h1 className="text-3xl font-semibold">러닝</h1>
          <p className="mt-2 text-muted-foreground">
            전문 작가들에게 배우는 디지털 드로잉 클래스
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-12">
        {/* 카테고리 필터 */}
        <div className="mb-8 flex gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* 추천 클래스 */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">추천 클래스</h2>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {classes.map((cls) => (
              <ClassCard key={cls.id} class={cls} />
            ))}
          </div>
        </section>

        {/* 인기 클래스 */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">인기 클래스</h2>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {classes.slice().reverse().map((cls) => (
              <ClassCard key={cls.id} class={cls} />
            ))}
          </div>
        </section>

        {/* 신규 클래스 */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">신규 클래스</h2>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {classes.slice(0, 2).map((cls) => (
              <ClassCard key={cls.id} class={cls} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
