"use client";
import { useState, useEffect } from "react";
import { X, Check, Image, Smile } from "lucide-react";
import { avatarAPI } from "@/services/api";

interface Avatar {
  url: string;
  name: string;
}

interface AvatarSelectorInlineProps {
  currentAvatar: string;
  onSelect: (avatar: Avatar) => void;
  onClose: () => void;
}

// Emoji头像列表 - 精选更好看的emoji
const emojiAvatars = [
  // 笑脸系列
  { url: "😊", name: "Smiling Face" },
  { url: "😄", name: "Grinning Face" },
  { url: "😃", name: "Grinning Face with Big Eyes" },
  { url: "😁", name: "Beaming Face" },
  { url: "😆", name: "Grinning Squinting Face" },
  { url: "😅", name: "Grinning Face with Sweat" },
  { url: "😂", name: "Face with Tears of Joy" },
  { url: "🤣", name: "Rolling on the Floor Laughing" },
  { url: "😇", name: "Smiling Face with Halo" },
  { url: "🙂", name: "Slightly Smiling Face" },
  { url: "🙃", name: "Upside-Down Face" },
  { url: "😉", name: "Winking Face" },
  { url: "😌", name: "Relieved Face" },
  { url: "😍", name: "Smiling Face with Heart-Eyes" },
  { url: "🥰", name: "Smiling Face with Hearts" },
  { url: "😘", name: "Face Blowing a Kiss" },
  { url: "😋", name: "Face Savoring Food" },
  { url: "😎", name: "Smiling Face with Sunglasses" },
  { url: "🤩", name: "Star-Struck" },
  { url: "🥳", name: "Partying Face" },
  { url: "😏", name: "Smirking Face" },
  
  // 可爱动物系列
  { url: "🐱", name: "Cat Face" },
  { url: "🐶", name: "Dog Face" },
  { url: "🐰", name: "Rabbit Face" },
  { url: "🐼", name: "Panda Face" },
  { url: "🐨", name: "Koala" },
  { url: "🐯", name: "Tiger Face" },
  { url: "🦁", name: "Lion Face" },
  { url: "🐸", name: "Frog Face" },
  { url: "🐷", name: "Pig Face" },
  { url: "🐮", name: "Cow Face" },
  { url: "🐵", name: "Monkey Face" },
  { url: "🐻", name: "Bear Face" },
  { url: "🦊", name: "Fox Face" },
  { url: "🐺", name: "Wolf Face" },
  { url: "🐹", name: "Hamster Face" },
  { url: "🐭", name: "Mouse Face" },
  { url: "🐹", name: "Hamster" },
  { url: "🐰", name: "Rabbit" },
  { url: "🦝", name: "Raccoon" },
  { url: "🦘", name: "Kangaroo" },
  { url: "🦡", name: "Badger" },
  { url: "🦃", name: "Turkey" },
  { url: "🦚", name: "Peacock" },
  { url: "🦜", name: "Parrot" },
  { url: "🦢", name: "Swan" },
  { url: "🦩", name: "Flamingo" },
  { url: "🦨", name: "Skunk" },
  { url: "🦦", name: "Otter" },
  { url: "🦥", name: "Sloth" },
  { url: "🦘", name: "Kangaroo" },
  { url: "🦡", name: "Badger" },
  { url: "🦃", name: "Turkey" },
  { url: "🦚", name: "Peacock" },
  { url: "🦜", name: "Parrot" },
  { url: "🦢", name: "Swan" },
  { url: "🦩", name: "Flamingo" },
  { url: "🦨", name: "Skunk" },
  { url: "🦦", name: "Otter" },
  { url: "🦥", name: "Sloth" },
  
  // 角色系列
  { url: "🤖", name: "Robot Face" },
  { url: "👻", name: "Ghost" },
  { url: "👽", name: "Alien" },
  { url: "👾", name: "Alien Monster" },
  { url: "🤡", name: "Clown Face" },
  { url: "👹", name: "Ogre" },
  { url: "👺", name: "Goblin" },
  { url: "😈", name: "Smiling Face with Horns" },
  { url: "👿", name: "Angry Face with Horns" },
  { url: "👼", name: "Baby Angel" },
  { url: "🎅", name: "Santa Claus" },
  { url: "🤶", name: "Mrs. Claus" },
  { url: "🧙‍♀️", name: "Woman Mage" },
  { url: "🧙‍♂️", name: "Man Mage" },
  { url: "🧚‍♀️", name: "Woman Fairy" },
  { url: "🧚‍♂️", name: "Man Fairy" },
  { url: "🧛‍♀️", name: "Woman Vampire" },
  { url: "🧛‍♂️", name: "Man Vampire" },
  { url: "🧜‍♀️", name: "Mermaid" },
  { url: "🧜‍♂️", name: "Merman" },
  { url: "🧝‍♀️", name: "Woman Elf" },
  { url: "🧝‍♂️", name: "Man Elf" },
  { url: "🧞‍♀️", name: "Woman Genie" },
  { url: "🧞‍♂️", name: "Man Genie" },
  { url: "🧟‍♀️", name: "Woman Zombie" },
  { url: "🧟‍♂️", name: "Man Zombie" },
  
  // 表情系列
  { url: "🤨", name: "Face with Raised Eyebrow" },
  { url: "🧐", name: "Face with Monocle" },
  { url: "🤓", name: "Nerd Face" },
  { url: "🤔", name: "Thinking Face" },
  { url: "🤭", name: "Face with Hand Over Mouth" },
  { url: "🤫", name: "Shushing Face" },
  { url: "🤗", name: "Hugging Face" },
  { url: "🤥", name: "Lying Face" },
  { url: "😶", name: "Face Without Mouth" },
  { url: "😐", name: "Neutral Face" },
  { url: "😑", name: "Expressionless Face" },
  { url: "😯", name: "Hushed Face" },
  { url: "😮", name: "Face with Open Mouth" },
  { url: "😲", name: "Astonished Face" },
  { url: "😴", name: "Sleeping Face" },
  { url: "🤤", name: "Drooling Face" },
  { url: "😪", name: "Sleepy Face" },
  { url: "😵", name: "Dizzy Face" },
  { url: "🥴", name: "Woozy Face" },
  { url: "😷", name: "Face with Medical Mask" },
  { url: "🤒", name: "Face with Thermometer" },
  { url: "🤕", name: "Face with Head-Bandage" },
  { url: "🤢", name: "Nauseated Face" },
  { url: "🤧", name: "Sneezing Face" },
];

export function AvatarSelectorInline({ currentAvatar, onSelect, onClose }: AvatarSelectorInlineProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const [activeTab, setActiveTab] = useState<'system' | 'emoji'>('system');

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemAvatars();
    }
  }, [activeTab]);

  const loadSystemAvatars = async () => {
    try {
      const response = await avatarAPI.getDefaultAvatars();
      setAvatars(response.data.avatars);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar.url);
  };

  const handleConfirm = () => {
    let selected: Avatar | undefined;
    
    if (activeTab === 'system') {
      selected = avatars.find(avatar => avatar.url === selectedAvatar);
    } else {
      selected = emojiAvatars.find(avatar => avatar.url === selectedAvatar);
    }
    
    if (selected) {
      onSelect(selected);
    }
    onClose();
  };

  const renderAvatarGrid = () => {
    if (activeTab === 'system') {
      if (loading) {
        return (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70E000]"></div>
          </div>
        );
      }
      
      return (
        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
          {avatars.map((avatar, index) => (
            <button
              key={index}
              onClick={() => handleAvatarSelect(avatar)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                selectedAvatar === avatar.url
                  ? 'border-[#70E000] ring-2 ring-[#70E000]/20'
                  : 'border-[#232323] hover:border-[#70E000]/50'
              }`}
            >
              <img
                src={avatar.url}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
              {selectedAvatar === avatar.url && (
                <div className="absolute inset-0 bg-[#70E000]/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-[#70E000]" />
                </div>
              )}
            </button>
          ))}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
          {emojiAvatars.map((avatar, index) => (
            <button
              key={index}
              onClick={() => handleAvatarSelect(avatar)}
              className={`relative w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center text-2xl ${
                selectedAvatar === avatar.url
                  ? 'border-[#70E000] ring-2 ring-[#70E000]/20 bg-[#70E000]/10'
                  : 'border-[#232323] hover:border-[#70E000]/50'
              }`}
            >
              {avatar.url}
              {selectedAvatar === avatar.url && (
                <div className="absolute inset-0 bg-[#70E000]/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-[#70E000]" />
                </div>
              )}
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="bg-[#151515] border border-[#232323] rounded-lg p-6 w-[500px] max-w-[90vw]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Choose Avatar</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'system'
              ? 'bg-[#70E000] text-black'
              : 'text-gray-400 hover:text-white hover:bg-[#232323]'
          }`}
        >
          <Image className="h-4 w-4" />
          <span>System</span>
        </button>
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'emoji'
              ? 'bg-[#70E000] text-black'
              : 'text-gray-400 hover:text-white hover:bg-[#232323]'
          }`}
        >
          <Smile className="h-4 w-4" />
          <span>Emoji</span>
        </button>
      </div>

      {/* Avatar Grid */}
      {renderAvatarGrid()}

      <div className="flex items-center justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-[#70E000] text-black rounded-lg hover:bg-[#5BC000] transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
