"use client";
import { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { SearchHeader } from "@/components/common/SearchHeader";
import { 
  Info, 
  Rocket, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Star, 
  ArrowRight,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// 功能特色数据
const features = [
  {
    id: 1,
    icon: Rocket,
    title: "Instant Token Creation",
    description: "Create your own token in minutes with our intuitive interface. No coding required.",
    color: "from-blue-500 to-purple-600"
  },
  {
    id: 2,
    icon: Shield,
    title: "Secure & Transparent",
    description: "Built on blockchain technology with smart contracts ensuring security and transparency.",
    color: "from-green-500 to-emerald-600"
  },
  {
    id: 3,
    icon: TrendingUp,
    title: "Real-time Analytics",
    description: "Track your token's performance with live market data and comprehensive analytics.",
    color: "from-orange-500 to-red-600"
  },
  {
    id: 4,
    icon: Users,
    title: "Community Driven",
    description: "Connect with other creators and investors in our vibrant community.",
    color: "from-purple-500 to-pink-600"
  }
];

// 使用步骤数据
const steps = [
  {
    id: 1,
    number: "01",
    title: "Connect Wallet",
    description: "Connect your Web3 wallet to get started. We support MetaMask, WalletConnect, and more.",
    icon: Shield,
    color: "from-blue-500 to-cyan-600"
  },
  {
    id: 2,
    number: "02",
    title: "Create Token",
    description: "Fill in your token details including name, symbol, and initial supply. Set your bonding curve parameters.",
    icon: Rocket,
    color: "from-green-500 to-emerald-600"
  },
  {
    id: 3,
    number: "03",
    title: "Deploy & Launch",
    description: "Deploy your token to the blockchain. Your token will be live and tradable immediately.",
    icon: Zap,
    color: "from-orange-500 to-red-600"
  },
  {
    id: 4,
    number: "04",
    title: "Grow & Manage",
    description: "Monitor your token's performance, manage liquidity, and engage with your community.",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-600"
  }
];

// 常见问题数据
const faqs = [
  {
    id: 1,
    question: "What is a bonding curve?",
    answer: "A bonding curve is a mathematical formula that determines the price of a token based on its supply. As more tokens are bought, the price increases, and as tokens are sold, the price decreases."
  },
  {
    id: 2,
    question: "How much does it cost to create a token?",
    answer: "Token creation costs include gas fees for blockchain transactions. The exact cost depends on network congestion and your chosen parameters."
  },
  {
    id: 3,
    question: "Can I customize my token's features?",
    answer: "Yes! You can customize various parameters including the bonding curve formula, initial price, and tokenomics to suit your project's needs."
  },
  {
    id: 4,
    question: "Is my token secure?",
    answer: "All tokens are deployed using audited smart contracts on secure blockchains. Your tokens are as secure as the underlying blockchain technology."
  },
  {
    id: 5,
    question: "How do I promote my token?",
    answer: "Use our built-in social features to share your token, engage with the community, and leverage our marketing tools to reach potential investors."
  },
  {
    id: 6,
    question: "What blockchains are supported?",
    answer: "We currently support multiple blockchains including Ethereum, Polygon, and other EVM-compatible networks. More networks are being added regularly."
  }
];

export default function HowItWorksPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="flex h-screen bg-[#0E0E0E]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <SearchHeader />
        
        <div className="flex-1 overflow-y-auto bg-[#0E0E0E]">
          <div className="px-6 py-6">
            {/* 标题区域 */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Info className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white font-hubot-sans mb-4">
                How It Works
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Learn how to create, launch, and manage your own tokens on our platform. 
                From concept to community, we've got you covered.
              </p>
            </div>

            {/* 功能特色 */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-8">Platform Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className="group bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-6 hover:border-[#70E000]/50 hover:shadow-xl hover:shadow-[#70E000]/10 transition-all duration-300"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                          <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 使用步骤 */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-8">Getting Started</h2>
              <div className="space-y-8">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={step.id} className="flex items-center space-x-8">
                      {/* 步骤图标 */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      {/* 步骤内容 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="text-3xl font-bold text-[#70E000]">{step.number}</span>
                          <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed">{step.description}</p>
                      </div>

                      {/* 箭头 */}
                      {index < steps.length - 1 && (
                        <div className="flex-shrink-0">
                          <ArrowRight className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 演示视频区域 */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-8">See It In Action</h2>
              <div className="relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-8">
                <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* 视频占位符 */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#70E000] to-[#5BC000] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play className="h-8 w-8 text-black ml-1" />
                    </div>
                    <p className="text-gray-400">Demo video coming soon</p>
                  </div>

                  {/* 视频控制按钮 */}
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <button
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 常见问题 */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
              <div className="max-w-4xl mx-auto space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#232323]/50 transition-colors"
                    >
                      <span className="text-white font-medium text-lg">{faq.question}</span>
                      <CheckCircle className={`h-5 w-5 text-[#70E000] transition-transform ${
                        expandedFaq === faq.id ? 'rotate-180' : ''
                      }`} />
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 行动号召 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#232323] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Create Your Token?</h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Join thousands of creators who have already launched their tokens on our platform. 
                  Start your journey today and build the next big thing in crypto.
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Button className="bg-gradient-to-r from-[#70E000] to-[#5BC000] hover:from-[#5BC000] hover:to-[#4AA000] text-black font-semibold px-8 py-3 rounded-xl shadow-lg">
                    <Rocket className="h-5 w-5 mr-2" />
                    Create Your Token
                  </Button>
                  <Button variant="outline" className="border-[#70E000] text-[#70E000] hover:bg-[#70E000] hover:text-black font-semibold px-8 py-3 rounded-xl">
                    <Users className="h-5 w-5 mr-2" />
                    Join Community
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pb-8"></div>
        </div>
      </div>
    </div>
  );
}
