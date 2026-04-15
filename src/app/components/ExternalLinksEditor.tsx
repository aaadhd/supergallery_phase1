import { useMemo } from 'react';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export interface ExternalLink {
  label: string;
  url: string;
}

interface PlatformDef {
  key: string;
  label: string;
  /** 도메인 접두 (placeholder/표시용) */
  prefix?: string;
  /** YouTube처럼 전체 URL을 받는 플랫폼 */
  fullUrl?: boolean;
  placeholder: string;
  icon: React.ReactNode;
}

const PLATFORMS: PlatformDef[] = [
  { key: 'instagram', label: 'instagram.com/', prefix: 'instagram.com/', placeholder: '나머지 URL을 입력해주세요.',
    icon: <Instagram className="h-5 w-5 text-[#E4405F]" /> },
  { key: 'youtube', label: 'youtube', fullUrl: true, placeholder: '전체 URL(https 포함)을 입력해주세요.',
    icon: <Youtube className="h-5 w-5 text-[#FF0000]" /> },
  { key: 'facebook', label: 'facebook.com/', prefix: 'facebook.com/', placeholder: '나머지 URL을 입력해주세요.',
    icon: <Facebook className="h-5 w-5 text-[#1877F2]" /> },
  { key: 'twitter', label: 'twitter.com/', prefix: 'twitter.com/', placeholder: '나머지 URL을 입력해주세요.',
    icon: <Twitter className="h-5 w-5 text-[#1DA1F2]" /> },
  { key: 'pinterest', label: 'pinterest.co.kr/', prefix: 'pinterest.co.kr/', placeholder: '나머지 URL을 입력해주세요.',
    icon: <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E60023] text-[10px] font-bold text-white">P</span> },
  { key: 'vimeo', label: 'vimeo.com/', prefix: 'vimeo.com/', placeholder: '나머지 URL을 입력해주세요.',
    icon: <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1AB7EA] text-[10px] font-bold text-white">V</span> },
];

const PLATFORM_KEYS = new Set(PLATFORMS.map(p => p.key));

interface Props {
  links: ExternalLink[];
  onChange: (next: ExternalLink[]) => void;
}

/**
 * 프로필 외부 링크 편집기 — 플랫폼 고정 행 방식 (PRD 화면 시안 기준).
 * 저장 형식: { label: platformKey, url: 사용자 입력 }[]
 *  - 일반 플랫폼: url에 username 또는 path 부분만 저장 (표시 시 prefix 합침)
 *  - youtube: url에 전체 URL
 *  - loud: url='enabled' 면 토글 ON
 *  - 기존 자유 입력 링크는 platform key와 매칭 안 되면 무시 (UI에서 노출 안 함)
 */
export function ExternalLinksEditor({ links, onChange }: Props) {
  const valueByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const l of links) {
      if (PLATFORM_KEYS.has(l.label)) map[l.label] = l.url;
    }
    return map;
  }, [links]);

  const update = (key: string, value: string) => {
    const others = links.filter(l => l.label !== key);
    if (value.trim()) {
      onChange([...others, { label: key, url: value }]);
    } else {
      onChange(others);
    }
  };

  return (
    <div className="space-y-3">
      {PLATFORMS.map((p) => {
        const value = valueByKey[p.key] ?? '';
        return (
          <div key={p.key} className="flex items-center gap-3">
            <span className="shrink-0">{p.icon}</span>
            <span className="hidden sm:inline shrink-0 text-sm text-muted-foreground min-w-[120px]">
              {p.label}
            </span>
            <input
              type="text"
              value={value}
              onChange={(e) => update(p.key, e.target.value)}
              placeholder={p.placeholder}
              className="flex-1 min-h-[44px] px-3 py-2 border border-input rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={p.label}
            />
          </div>
        );
      })}
    </div>
  );
}

/** 표시용 — 저장된 ExternalLink 배열을 풀 URL로 변환 (조회 화면에서 사용) */
export function resolveExternalLinkUrl(link: ExternalLink): string {
  const platform = PLATFORMS.find(p => p.key === link.label);
  if (!platform) return link.url;
  if (platform.fullUrl) return link.url;
  if (!link.url) return '';
  // 사용자가 https://를 포함해 입력했다면 그대로 사용
  if (/^https?:\/\//i.test(link.url)) return link.url;
  return `https://${platform.prefix ?? ''}${link.url}`;
}

export function getExternalLinkPlatformLabel(key: string): string {
  return PLATFORMS.find(p => p.key === key)?.label ?? key;
}

/** 표시용 아이콘 + 사람이 읽을 플랫폼 이름 (조회 화면에서 사용) */
export function getExternalLinkPlatformDisplay(key: string): { icon: React.ReactNode; name: string } | null {
  const p = PLATFORMS.find((x) => x.key === key);
  if (!p) return null;
  const nameMap: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
    twitter: 'Twitter',
    pinterest: 'Pinterest',
    vimeo: 'Vimeo',
  };
  return { icon: p.icon, name: nameMap[key] ?? p.label };
}
