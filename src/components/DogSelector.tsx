import React from 'react';
import { DogBreedId, DOG_BREEDS, DogBreedInfo } from '../types/game.ts';
import { Shield, Zap, Flame, Wind, Crosshair } from 'lucide-react';

interface DogSelectorProps {
  selectedBreed: DogBreedId;
  onSelectBreed: (breed: DogBreedId) => void;
  disabled?: boolean;
}

export const DogSelector: React.FC<DogSelectorProps> = ({
  selectedBreed,
  onSelectBreed,
  disabled = false
}) => {
  const breeds = Object.values(DOG_BREEDS);
  const currentBreedInfo: DogBreedInfo = DOG_BREEDS[selectedBreed];

  return (
    <div className="flex flex-col gap-4">
      {/* Breeds Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {breeds.map((breed) => {
          const isSelected = breed.id === selectedBreed;
          return (
            <button
              key={breed.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectBreed(breed.id)}
              className={`relative group flex flex-col items-center p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-900/60'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {/* Laser Color indicator glow pill */}
              <div
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: breed.laserColor,
                  boxShadow: `0 0 8px ${breed.laserColor}`
                }}
              />

              {/* Avatar Icon */}
              <div className="text-3xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">
                {breed.avatarIcon}
              </div>

              {/* Name & Codename */}
              <span className="font-['Orbitron'] font-bold text-xs tracking-wider text-slate-100">
                {breed.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono tracking-tighter uppercase">
                {breed.role}
              </span>

              {/* Selected highlight line */}
              {isSelected && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: breed.laserColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Card for Selected Cyber Dog */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md relative overflow-hidden">
        {/* Neon corner bracket */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentBreedInfo.avatarIcon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-['Orbitron'] text-lg font-bold text-white tracking-wide">
                    {currentBreedInfo.name}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded">
                    {currentBreedInfo.codename}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-['Chakra_Petch']">
                  {currentBreedInfo.lore}
                </p>
              </div>
            </div>

            {/* Special Canine Laser Weapon & Passive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-xs">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400">Láser Bucal:</span>
                <span className="text-slate-100 font-mono font-semibold" style={{ color: currentBreedInfo.laserColor }}>
                  {currentBreedInfo.laserType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400">Habilidad:</span>
                <span className="text-amber-200 font-mono font-semibold">
                  {currentBreedInfo.specialAbility}
                </span>
              </div>
            </div>
          </div>

          {/* Canine Stats Bars */}
          <div className="w-full md:w-60 space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
            {/* Speed */}
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> Velocidad
                </span>
                <span className="text-cyan-300">{currentBreedInfo.speed * 10} km/h</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${(currentBreedInfo.speed / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Shield */}
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Escudo Máximo
                </span>
                <span className="text-emerald-300">{currentBreedInfo.maxShield} EP</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${(currentBreedInfo.maxShield / 150) * 100}%` }}
                />
              </div>
            </div>

            {/* Damage */}
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" /> Potencia Láser
                </span>
                <span className="text-rose-300">{currentBreedInfo.laserDamage} Dmg</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400"
                  style={{ width: `${(currentBreedInfo.laserDamage / 45) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
