import React, { useState } from 'react';
import { Camera, User } from 'lucide-react';

interface ProfileStepProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  email: string;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  avatarPreview: string | null;
  onAvatarSelect: (file: File) => void;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  displayName, setDisplayName, email, dateOfBirth, setDateOfBirth, avatarPreview, onAvatarSelect
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarSelect(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-600" />
            )}
          </div>
          <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <p className="text-xs text-slate-500">Clique para adicionar uma foto</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Nome de exibição *</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
          placeholder="Como quer ser chamado?"
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">E-mail</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Data de nascimento *</label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
        />
      </div>
    </div>
  );
};
