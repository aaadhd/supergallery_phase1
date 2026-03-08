import { useState } from 'react';

export default function ExhibitionCustomize() {
  const [selectedTab, setSelectedTab] = useState<'wall' | 'frame' | 'effect' | 'lighting'>('wall');
  const [selectedWallColor, setSelectedWallColor] = useState('#FAFAFA');
  const [selectedTexture, setSelectedTexture] = useState('smooth');
  const [matSize, setMatSize] = useState(20);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(30);
  const [selectedFrame, setSelectedFrame] = useState('modern');
  const [lightingAngle, setLightingAngle] = useState(45);
  const [lightingIntensity, setLightingIntensity] = useState(70);

  const wallColors = [
    { id: 'white', color: '#FFFFFF', name: '퓨어 화이트' },
    { id: 'cream', color: '#FAFAFA', name: '오프 화이트' },
    { id: 'beige', color: '#F5F1E8', name: '베이지' },
    { id: 'sage', color: '#E8EEE7', name: '세이지' },
    { id: 'gray', color: '#E0E0E0', name: '라이트 그레이' },
    { id: 'charcoal', color: '#3A3A3A', name: '차콜' },
    { id: 'navy', color: '#1A2332', name: '네이비' },
    { id: 'burgundy', color: '#5C2E2E', name: '버건디' },
  ];

  const textures = [
    { id: 'smooth', name: '매끄러운 벽면', description: '모던 갤러리' },
    { id: 'canvas', name: '캔버스 질감', description: '거친 느낌' },
    { id: 'hanji', name: '한지 텍스처', description: '전통적 느낌' },
    { id: 'concrete', name: '콘크리트', description: '산업적 느낌' },
  ];

  const frames = [
    { id: 'modern', name: '모던 블랙', description: '심플한 검정 프레임' },
    { id: 'wood', name: '원목 프레임', description: '따뜻한 나무 질감' },
    { id: 'gold', name: '골드 클래식', description: '고급스러운 금색' },
    { id: 'white', name: '화이트 프레임', description: '깔끔한 흰색' },
  ];

  const effects = [
    {
      id: 'macke',
      name: 'August Macke',
      description: '생생한 표현주의',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCF7F 50%, #4D96FF 75%, #A78BFA 100%)',
      svgFilter: 'aether',
    },
    {
      id: 'yunbok',
      name: '신윤복 풍',
      description: '섬세한 수묵화',
      gradient: 'linear-gradient(135deg, #E8D5C4 0%, #A89F91 50%, #5C5552 100%)',
      svgFilter: 'vintage',
    },
    {
      id: 'saimdang',
      name: '신사임당 풍',
      description: '우아한 초충도',
      gradient: 'linear-gradient(135deg, #C8E6C9 0%, #81C784 50%, #4CAF50 100%)',
      svgFilter: 'frost',
    },
    {
      id: 'monet',
      name: 'Monet 인상주의',
      description: '몽환적인 빛',
      gradient: 'linear-gradient(135deg, #B3E5FC 0%, #81D4FA 33%, #4FC3F7 66%, #29B6F6 100%)',
      svgFilter: 'liquid',
    },
    {
      id: 'kandinsky',
      name: 'Kandinsky 추상',
      description: '역동적인 형태',
      gradient: 'linear-gradient(135deg, #FF4081 0%, #F50057 25%, #C51162 50%, #880E4F 100%)',
      svgFilter: 'cyber',
    },
    {
      id: 'hokusai',
      name: '호쿠사이 파도',
      description: '일본 우키요에',
      gradient: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 50%, #0D47A1 100%)',
      svgFilter: 'digital',
    },
    {
      id: 'klimt',
      name: 'Klimt 황금',
      description: '화려한 장식미',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA000 50%, #FF6F00 100%)',
      svgFilter: 'neon',
    },
    {
      id: 'vangogh',
      name: 'Van Gogh 소용돌이',
      description: '역동적인 붓터치',
      gradient: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 50%, #7ED321 100%)',
      svgFilter: 'hologram',
    },
  ];

  return (
    <div className="h-screen bg-[#FAFAFA] flex flex-col overflow-hidden">
      {/* SVG 필터 정의 */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* 에테르 */}
          <filter id="aether">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.2 0 0 0 0.05
                      0 1.1 0.2 0 0.1
                      0 0.1 1.3 0 0.15
                      0 0 0 1 0"
              result="colorShift"
            />
            <feGaussianBlur in="colorShift" stdDeviation="8" result="glow" />
            <feBlend in="colorShift" in2="glow" mode="screen" />
          </filter>

          {/* 리퀴드 */}
          <filter id="liquid">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" result="displace" />
            <feColorMatrix in="displace" type="saturate" values="1.6" result="saturated" />
            <feGaussianBlur in="saturated" stdDeviation="0.8" />
          </filter>

          {/* 사이버 */}
          <filter id="cyber">
            <feOffset in="SourceGraphic" dx="3" dy="0" result="offsetR" />
            <feOffset in="SourceGraphic" dx="-3" dy="0" result="offsetB" />
            <feColorMatrix
              in="offsetR"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.7 0"
              result="redChannel"
            />
            <feColorMatrix
              in="offsetB"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 0.7 0"
              result="blueChannel"
            />
            <feBlend in="redChannel" in2="SourceGraphic" mode="screen" result="blend1" />
            <feBlend in="blueChannel" in2="blend1" mode="screen" />
          </filter>

          {/* 디지털 */}
          <filter id="digital">
            <feTurbulence type="fractalNoise" baseFrequency="0.8 0.01" numOctaves="1" result="scanlines" />
            <feBlend in="SourceGraphic" in2="scanlines" mode="hard-light" result="scanBlend" />
            <feComponentTransfer in="scanBlend">
              <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
              <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
              <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            </feComponentTransfer>
          </filter>

          {/* 네온 */}
          <filter id="neon">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.5 0 0 0 0
                      0 1.3 0.3 0 0
                      0.3 0 1.6 0 0
                      0 0 0 1 0"
              result="colorBoost"
            />
            <feGaussianBlur in="colorBoost" stdDeviation="12" result="glow1" />
            <feBlend in="colorBoost" in2="glow1" mode="screen" />
          </filter>

          {/* 빈티지 */}
          <filter id="vintage">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.08 0"
              result="grainAlpha"
            />
            <feBlend in="SourceGraphic" in2="grainAlpha" mode="multiply" result="grainBlend" />
            <feColorMatrix
              in="grainBlend"
              type="matrix"
              values="1.1 0.15 0.05 0 0
                      0.1 1 0.1 0 0
                      0.05 0.1 0.8 0 0
                      0 0 0 1 0"
            />
          </filter>

          {/* 프로스트 */}
          <filter id="frost">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" result="frost" />
            <feDisplacementMap in="SourceGraphic" in2="frost" scale="8" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="4" />
          </filter>

          {/* 홀로그램 */}
          <filter id="hologram">
            <feOffset in="SourceGraphic" dx="2" dy="0" result="offsetR" />
            <feOffset in="SourceGraphic" dx="-2" dy="0" result="offsetB" />
            <feColorMatrix
              in="offsetR"
              type="matrix"
              values="0.8 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.6 0"
              result="redCh"
            />
            <feColorMatrix
              in="offsetB"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0.8 0 0
                      0 0 0 0.6 0"
              result="blueCh"
            />
            <feBlend in="redCh" in2="SourceGraphic" mode="screen" result="blend1" />
            <feBlend in="blend1" in2="blueCh" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* 상단 60%: 작품 미리보기 영역 */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: selectedWallColor }}>
        <div className="relative">
          {/* 액자 프레임 */}
          <div
            className="relative"
            style={{
              padding: `${matSize}px`,
              backgroundColor: selectedFrame === 'gold' ? '#D4AF37' : selectedFrame === 'wood' ? '#8B4513' : selectedFrame === 'white' ? '#FFFFFF' : '#000000',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* 매트 (여백) */}
            <div
              className="relative"
              style={{
                padding: `${matSize * 2}px`,
                backgroundColor: '#FFFFFF',
              }}
            >
              {/* 작품 이미지 */}
              <div className="relative w-[600px] h-[450px] bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 overflow-hidden">
                {/* 텍스처 오버레이 */}
                {selectedTexture === 'canvas' && (
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")' }} />
                )}
                {selectedTexture === 'hanji' && (
                  <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'hanji\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.4\' numOctaves=\'3\' /%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23hanji)\' fill=\'%23f5f1e8\' /%3E%3C/svg%3E")' }} />
                )}
                {selectedTexture === 'concrete' && (
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'150\' height=\'150\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'concrete\'%3E%3CfeTurbulence baseFrequency=\'0.6\' numOctaves=\'2\' /%3E%3C/filter%3E%3Crect width=\'150\' height=\'150\' filter=\'url(%23concrete)\' /%3E%3C/svg%3E")' }} />
                )}

                {/* 미디어 아트 효과 */}
                {selectedEffect && (
                  <div
                    className="absolute inset-0"
                    style={{
                      filter: `url(#${effects.find(e => e.id === selectedEffect)?.svgFilter})`,
                      background: effects.find(e => e.id === selectedEffect)?.gradient,
                      opacity: intensity / 100,
                      mixBlendMode: 'overlay',
                    }}
                  />
                )}

                {/* 조명 효과 */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at ${lightingAngle}% 0%, rgba(255,255,255,${lightingIntensity / 200}) 0%, transparent 60%)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 40%: 바텀 시트 모달 */}
      <div className="h-[40vh] bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 flex flex-col">
        {/* 탭 네비게이션 */}
        <div className="flex border-b-2 border-gray-200">
          {[
            { id: 'wall', label: '벽면', icon: '🎨' },
            { id: 'frame', label: '액자', icon: '🖼️' },
            { id: 'effect', label: '효과', icon: '✨' },
            { id: 'lighting', label: '조명', icon: '💡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-6 text-center transition-all ${
                selectedTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl mb-1">{tab.icon}</div>
              <div className="text-[18px] font-bold">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Wall 탭 */}
          {selectedTab === 'wall' && (
            <div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-6">벽면 색상</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 mb-8">
                {wallColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedWallColor(color.color)}
                    className={`flex-shrink-0 flex flex-col items-center gap-3 transition-transform ${
                      selectedWallColor === color.color ? 'scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`w-20 h-20 rounded-full border-4 transition-all ${
                        selectedWallColor === color.color ? 'border-cyan-500 shadow-lg' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.color }}
                    />
                    <span className="text-[14px] font-medium text-gray-700">{color.name}</span>
                  </button>
                ))}
              </div>

              <h3 className="text-[22px] font-bold text-gray-900 mb-6">벽면 질감</h3>
              <div className="grid grid-cols-2 gap-4">
                {textures.map((texture) => (
                  <button
                    key={texture.id}
                    onClick={() => setSelectedTexture(texture.id)}
                    className={`p-6 rounded-2xl border-3 transition-all text-left ${
                      selectedTexture === texture.id
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-[18px] font-bold text-gray-900 mb-2">{texture.name}</div>
                    <div className="text-[15px] text-gray-600">{texture.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frame 탭 */}
          {selectedTab === 'frame' && (
            <div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-6">액자 스타일</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {frames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame.id)}
                    className={`p-6 rounded-2xl border-3 transition-all text-left ${
                      selectedFrame === frame.id
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-[18px] font-bold text-gray-900 mb-2">{frame.name}</div>
                    <div className="text-[15px] text-gray-600">{frame.description}</div>
                  </button>
                ))}
              </div>

              <h3 className="text-[22px] font-bold text-gray-900 mb-6">매트 여백</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={matSize}
                  onChange={(e) => setMatSize(Number(e.target.value))}
                  className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  style={{
                    background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${((matSize - 10) / 40) * 100}%, #D1D5DB ${((matSize - 10) / 40) * 100}%, #D1D5DB 100%)`,
                  }}
                />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[16px] text-gray-600">좁게</span>
                  <span className="text-[24px] font-bold text-gray-900">{matSize}px</span>
                  <span className="text-[16px] text-gray-600">넓게</span>
                </div>
              </div>
            </div>
          )}

          {/* Effect 탭 */}
          {selectedTab === 'effect' && (
            <div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-6">미디어 아트 효과</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {effects.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => setSelectedEffect(effect.id === selectedEffect ? null : effect.id)}
                    className={`relative overflow-hidden rounded-2xl border-3 transition-all ${
                      selectedEffect === effect.id
                        ? 'border-cyan-500 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {/* 효과 프리뷰 */}
                    <div
                      className="h-32"
                      style={{
                        filter: `url(#${effect.svgFilter})`,
                        background: effect.gradient,
                      }}
                    />
                    {/* 텍스트 */}
                    <div className="p-4 bg-white">
                      <div className="text-[16px] font-bold text-gray-900 mb-1">{effect.name}</div>
                      <div className="text-[13px] text-gray-600">{effect.description}</div>
                    </div>
                    {/* 선택 표시 */}
                    {selectedEffect === effect.id && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 강도 조절 */}
              {selectedEffect && (
                <>
                  <h3 className="text-[22px] font-bold text-gray-900 mb-6">효과 강도</h3>
                  <div className="px-2 mb-8">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      style={{
                        background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${intensity}%, #D1D5DB ${intensity}%, #D1D5DB 100%)`,
                      }}
                    />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[16px] text-gray-600">약하게</span>
                      <span className="text-[24px] font-bold text-gray-900">{intensity}%</span>
                      <span className="text-[16px] text-gray-600">강하게</span>
                    </div>
                  </div>

                  <h3 className="text-[22px] font-bold text-gray-900 mb-6">애니메이션 속도</h3>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      style={{
                        background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${speed}%, #D1D5DB ${speed}%, #D1D5DB 100%)`,
                      }}
                    />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[16px] text-gray-600">느리게</span>
                      <span className="text-[24px] font-bold text-gray-900">{speed}%</span>
                      <span className="text-[16px] text-gray-600">빠르게</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Lighting 탭 */}
          {selectedTab === 'lighting' && (
            <div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-6">조명 각도</h3>
              <div className="px-2 mb-8">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lightingAngle}
                  onChange={(e) => setLightingAngle(Number(e.target.value))}
                  className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  style={{
                    background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${lightingAngle}%, #D1D5DB ${lightingAngle}%, #D1D5DB 100%)`,
                  }}
                />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[16px] text-gray-600">←</span>
                  <span className="text-[24px] font-bold text-gray-900">{lightingAngle}°</span>
                  <span className="text-[16px] text-gray-600">→</span>
                </div>
              </div>

              <h3 className="text-[22px] font-bold text-gray-900 mb-6">조명 밝기</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lightingIntensity}
                  onChange={(e) => setLightingIntensity(Number(e.target.value))}
                  className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  style={{
                    background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${lightingIntensity}%, #D1D5DB ${lightingIntensity}%, #D1D5DB 100%)`,
                  }}
                />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[16px] text-gray-600">어둡게</span>
                  <span className="text-[24px] font-bold text-gray-900">{lightingIntensity}%</span>
                  <span className="text-[16px] text-gray-600">밝게</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
