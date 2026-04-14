import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from 'remotion';

const MASTER = staticFile("ADS13-PAGINA/PaginaArte.png");
const CHART_V = staticFile("ADS13-PAGINA/INGR0002-Grafico-3-Mobile-2.png");
const CHART_H = staticFile("ADS13-PAGINA/INGR0002-Grafico-4-Mobile-1.png");

const TextLine: React.FC<{ children: React.ReactNode, delay: number, size: number, weight: number, color?: string, italic?: boolean }> = ({ children, delay, size, weight, color = '#ffffff', italic = false }) => {
    const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
    const { fps } = useVideoConfig();
    const t = frame - delay;
    const entry = spring({ frame: t, fps, config: { damping: 15, stiffness: 40, mass: 1.2 } });
    
    // Explicit animation matching keynote text requirements smoothly easing upward
    const op = interpolate(t, [0, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    const shift = interpolate(entry, [0, 1], [50, 0]);

    return (
        <div style={{ 
            opacity: op, 
            transform: `translateY(${shift}px)`,
            fontFamily: '"Proxima Nova", system-ui, Arial, sans-serif',
            fontSize: `${size}px`,
            fontWeight: weight,
            color: color,
            fontStyle: italic ? 'italic' : 'normal',
            lineHeight: 1.1,
            letterSpacing: size > 60 ? '-2px' : '-0.5px'
        }}>
            {children}
        </div>
    );
};

// Orchestrates separated user graphics directly integrating raw external exports fluidly settling their structures explicitly matching editorial formatting timelines.
const ChartAsset: React.FC<{ src: string, x: number, y: number, w: number, delay: number }> = ({ src, x, y, w, delay }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const entry = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 40, mass: 1.2 } });
    
    const op = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    const shift = interpolate(entry, [0, 1], [50, 0]);

    return (
        <div style={{ position: 'absolute', top: y, left: x, width: w, opacity: op, transform: `translateY(${shift}px)` }}>
            <img src={src} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </div>
    );
};

// Pure DOM synthesis replicating the news cards perfectly, avoiding any raster extraction 'dark boxes' or bounding slice severing.
const FintechNewsLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ color: '#e3242b', fontSize: 26, fontWeight: 900, transform: 'skewX(-15deg)', letterSpacing: '-2px' }}>FF</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.8 }}>
             <span style={{ fontSize: 9, fontWeight: 800, color: '#000', letterSpacing: '1px' }}>FINTECH FINANCE</span>
             <span style={{ fontSize: 22, fontWeight: 900, color: '#000', letterSpacing: '-1px' }}>NEWS</span>
        </div>
    </div>
);

const FintechTimesLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: '"Times New Roman", serif' }}>
         <span style={{ fontSize: 16, color: '#333' }}>THE</span>
         <div style={{ backgroundColor: '#000', color: '#fff', padding: '2px 6px', fontSize: 16, fontWeight: 'bold', borderRadius: 2 }}>FINTECH</div>
         <span style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>TIMES</span>
    </div>
);

const AnimCard: React.FC<{ x: number, y: number, delay: number, date: string, LogoComponent: React.FC, children: React.ReactNode }> = ({ x, y, delay, date, LogoComponent, children }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const entry = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 45, mass: 1.2 } });
    
    const op = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    const shift = interpolate(entry, [0, 1], [40, 0]);

    return (
        <div style={{
            position: 'absolute', top: y, left: x, width: 440, height: 180,
            backgroundColor: '#f5f6f8', borderRadius: 6,
            boxShadow: '0 15px 35px rgba(2, 6, 4, 0.4)', // Soft immersive shadow native to absolute environment 
            opacity: op, transform: `translateY(${shift}px)`,
            display: 'flex', flexDirection: 'column',
            padding: '25px', boxSizing: 'border-box'
        }}>
            <div style={{ position: 'absolute', top: -15, right: 25, backgroundColor: '#fff', padding: '6px 12px', borderRadius: 4, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                <LogoComponent />
            </div>
            
            <span style={{ fontFamily: '"Proxima Nova", system-ui, sans-serif', fontSize: 14, color: '#888', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>
               {date}
            </span>
            <div style={{ fontFamily: '"Proxima Nova", system-ui, sans-serif', fontSize: 25, color: '#1a1f1c', fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
               {children}
            </div>
        </div>
    );
}

export const ReasonScene: React.FC = () => {
    const frame = useCurrentFrame();
    // Timeline aggressively compressed fulfilling strict <5s lock-up logic natively extending fully through duration.

    return (
        <AbsoluteFill style={{ backgroundColor: '#07180e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* Global Scaling Wrapper natively satisfying Video Safe Margin boundary requirements without causing mathematical offset misaligns internally */}
            <div style={{ position: 'relative', width: 2560, height: 1080, transform: 'scale(0.85)', transformOrigin: 'center' }}>


                {/* ========================================================
                    1. LEFT COLUMN: MASTER HEADLINE & PARAGRAPH 1
                ======================================================== */}
                <div style={{ position: 'absolute', top: 120, left: 100, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <TextLine delay={0} size={92} weight={900}>POR QUE TRABALHAR</TextLine>
                    <TextLine delay={3} size={92} weight={900}>NO MERCADO</TextLine>
                    <TextLine delay={6} size={92} weight={900} color="#edd66b">FINANCEIRO É O SONHO</TextLine>
                    <TextLine delay={9} size={92} weight={900} color="#edd66b">DE MUITA GENTE?</TextLine>
                    <div style={{ height: 25 }} />
                    <TextLine delay={15} size={36} weight={300}>ESSES 3 MOTIVOS EXPLICAM:</TextLine>
                </div>

                <div style={{ position: 'absolute', top: 620, left: 100, display: 'flex', flexDirection: 'column', width: '600px' }}>
                    <TextLine delay={20} size={200} weight={900} color="#edd66b" italic>1</TextLine>
                    <div style={{ height: 10 }} />
                    <TextLine delay={25} size={46} weight={700}>No ranking de satisfação</TextLine>
                    <TextLine delay={28} size={46} weight={700}>profissional, o mercado</TextLine>
                    <TextLine delay={31} size={46} weight={700}>financeiro é um dos três</TextLine>
                    <TextLine delay={34} size={46} weight={700}>primeiros setores no Brasil.</TextLine>
                </div>

                {/* HTML Article Cards resolving identical reference fidelity entirely natively bypassing all bounding slice extraction box glitches forever. */}
                <AnimCard x={750} y={660} delay={35} date="15 Janeiro de 2021" LogoComponent={FintechNewsLogo}>
                    Estudo revela que <span style={{fontWeight: 800}}>setor de<br/>finanças está entre os mais<br/>satisfatórios</span> para se trabalhar
                </AnimCard>
                <AnimCard x={750} y={870} delay={40} date="18 Janeiro de 2021" LogoComponent={FintechTimesLogo}>
                    <span style={{fontWeight: 800}}>Setor financeiro é um dos<br/>melhores setores</span> em satisfação<br/><span style={{fontSize: 20}}>do trabalho, aponta estudo</span>
                </AnimCard>


                {/* ========================================================
                    2. TOP RIGHT COLUMN: PARAGRAPH 2 & SEPARATED CHART Graphic
                ======================================================== */}
                <div style={{ position: 'absolute', top: 80, left: 1280, display: 'flex', flexDirection: 'column', width: '480px' }}>
                    <TextLine delay={50} size={180} weight={900} color="#edd66b" italic>2</TextLine>
                    <div style={{ height: 10 }} />
                    <TextLine delay={54} size={42} weight={700}>Profissionais do setor</TextLine>
                    <TextLine delay={57} size={42} weight={700}>financeiro ganham, em</TextLine>
                    <TextLine delay={60} size={42} weight={700}>média, 138% a mais que</TextLine>
                    <TextLine delay={63} size={42} weight={700}>a média nacional já na</TextLine>
                    <TextLine delay={66} size={42} weight={700}>contratação.</TextLine>
                </div>

                {/* Employs the explicit separated Chart Element asset dynamically integrated cleanly without nested text overlaps causing duplication bugs */}
                <ChartAsset src={CHART_V} x={1800} y={110} w={680} delay={75} />


                {/* ========================================================
                    3. BOTTOM RIGHT COLUMN: PARAGRAPH 3 & SEPARATED CHART Graphic
                ======================================================== */}
                <div style={{ position: 'absolute', top: 570, left: 1280, display: 'flex', flexDirection: 'column', width: '500px' }}>
                    <TextLine delay={90} size={180} weight={900} color="#edd66b" italic>3</TextLine>
                    <div style={{ height: 10 }} />
                    <TextLine delay={94} size={42} weight={700}>Quem tem ensino</TextLine>
                    <TextLine delay={97} size={42} weight={700}>superior e atua no</TextLine>
                    <TextLine delay={100} size={42} weight={700}>mercado financeiro tem</TextLine>
                    <TextLine delay={103} size={42} weight={700}>uma das menores taxas</TextLine>
                    <TextLine delay={106} size={42} weight={700}>de desemprego do país.</TextLine>
                </div>

                {/* Employs the explicit separated Chart Element asset dynamically integrated cleanly without nested text overlaps */}
                <ChartAsset src={CHART_H} x={1820} y={580} w={680} delay={115} />


            </div>
        </AbsoluteFill>
    );
};
