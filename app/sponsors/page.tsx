// app/sponsors/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { title, subtitle } from "@/components/Primitives";
import { sponsorService, Sponsor, sponsorTiers } from "@/lib/sponsors";
import { ExternalLinkIcon, MailIcon, TrendingUpIcon, UsersIcon, AwardIcon, SparklesIcon, ArrowRightIcon } from "lucide-react";

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      const allSponsors = await sponsorService.getActiveSponsors();
      setSponsors(allSponsors);
    } catch (error) {
      console.error("Error loading sponsors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary mx-auto" />
          <p className="text-default-500 font-medium">Loading sponsors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16 space-y-12 sm:space-y-14 md:space-y-16 lg:space-y-20">
        {/* Hero */}
        
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 max-w-3xl mx-auto">
          
          
          <h1 className={title({ size: "lg" })}>
            Our <span className={title({ color: "violet", size: "lg" })}>Amazing Sponsors</span>
          </h1>
          
          <p className="text-xs sm:text-small md:text-base lg:text-lg text-default-600">
            Thank you to these incredible organizations for supporting our community
          </p>
        </div>

        {/* Sponsors Grid */}
        {sponsors.length === 0 ? (
          <Card className="max-w-2xl mx-auto" shadow="sm">
            <CardBody className="text-center py-12 sm:py-16 md:py-20 space-y-3 sm:space-y-4 md:space-y-5 px-4 sm:px-6 md:px-8">
              <div className="w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 rounded-full bg-default-100 flex items-center justify-center mx-auto">
                <UsersIcon className="w-7 sm:w-8 md:w-10 h-7 sm:h-8 md:h-10 text-default-400" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">No Sponsors Yet</h3>
              <p className="text-xs sm:text-small md:text-base text-default-500">Be the first to support our community</p>
              <Button
                as="a"
                href="mailto:sponsors@mindmesh.club"
                color="primary"
                variant="shadow"
                size="lg"
                endContent={<MailIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />}
              >
                Become a Sponsor
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            {sponsors.map((sponsor, index) => {
              const tierInfo = sponsorTiers[sponsor.tier as keyof typeof sponsorTiers];
              
              return (
                <Card
                  key={sponsor.$id}
                  isPressable
                  isHoverable
                  as="a"
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                  shadow="sm"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: 'fadeIn 0.5s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <CardHeader className="absolute z-10 top-1 right-1">
                    <Chip 
                      size="sm" 
                      variant="flat"
                      classNames={{
                        base: `bg-gradient-to-r ${tierInfo.color} opacity-0 group-hover:opacity-100 transition-opacity`,
                        content: "text-white text-[10px] font-semibold px-1"
                      }}
                    >
                      {sponsor.tier.toUpperCase()}
                    </Chip>
                  </CardHeader>
                  
                  <CardBody className="p-6 flex items-center justify-center h-40">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110"
                    />
                  </CardBody>
                  
                  <CardFooter className="absolute bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full space-y-1">
                      <p className="text-white text-xs font-semibold line-clamp-1">
                        {sponsor.name}
                      </p>
                      {sponsor.category && (
                        <p className="text-white/70 text-[10px] uppercase tracking-wider">
                          {sponsor.category}
                        </p>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <Divider className="my-8 sm:my-10 md:my-12 lg:my-16" />

        {/* CTA */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-purple-500/10 to-pink-500/10" shadow="lg">
          <CardBody className="p-6 sm:p-8 md:p-12 lg:p-16 text-center space-y-5 sm:space-y-6 md:space-y-8">
            <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
              <AwardIcon className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-white" />
            </div>
            
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">Interested in Sponsoring?</h2>
              <p className="text-xs sm:text-small md:text-base lg:text-lg text-default-600 max-w-2xl mx-auto">
                Partner with MIND Mesh to support our community and connect with top talent
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-2 md:pt-4">
              <Card shadow="none" className="bg-white/50 dark:bg-default-100/50">
                <CardBody className="p-4 md:p-6 text-center space-y-2 md:space-y-3">
                  <TrendingUpIcon className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 text-purple-500 mx-auto" />
                  <p className="text-xs sm:text-small md:text-base font-semibold">Brand Visibility</p>
                  <p className="text-[10px] sm:text-xs md:text-small text-default-500">Reach 500+ students</p>
                </CardBody>
              </Card>

              <Card shadow="none" className="bg-white/50 dark:bg-default-100/50">
                <CardBody className="p-4 md:p-6 text-center space-y-2 md:space-y-3">
                  <UsersIcon className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 text-pink-500 mx-auto" />
                  <p className="text-xs sm:text-small md:text-base font-semibold">Talent Pipeline</p>
                  <p className="text-[10px] sm:text-xs md:text-small text-default-500">Connect with top talent</p>
                </CardBody>
              </Card>

              <Card shadow="none" className="bg-white/50 dark:bg-default-100/50">
                <CardBody className="p-4 md:p-6 text-center space-y-2 md:space-y-3">
                  <AwardIcon className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 text-blue-500 mx-auto" />
                  <p className="text-xs sm:text-small md:text-base font-semibold">Community Impact</p>
                  <p className="text-[10px] sm:text-xs md:text-small text-default-500">Support education</p>
                </CardBody>
              </Card>
            </div>

            <Button
              as="a"
              href="mailto:sponsors@mindmesh.club"
              color="primary"
              size="lg"
              variant="shadow"
              endContent={<ArrowRightIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />}
              className="font-semibold mt-2 md:mt-4"
            >
              Become a Sponsor
            </Button>
          </CardBody>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}