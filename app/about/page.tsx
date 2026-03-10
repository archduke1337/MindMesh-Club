import { Card, CardBody } from "@heroui/card";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { title, subtitle } from "@/components/Primitives";

export default function AboutPage() {
  const stats = [
    { label: "Active Members", value: "500+", color: "primary" },
    { label: "Events Hosted", value: "50+", color: "secondary" },
    { label: "Projects Built", value: "100+", color: "success" },
    { label: "Years Running", value: "3+", color: "warning" },
  ];

  const values = [
    {
      icon: "💡",
      title: "Innovation",
      description: "We foster creativity and encourage thinking outside the box",
    },
    {
      icon: "🤝",
      title: "Collaboration",
      description: "Building connections and working together to achieve more",
    },
    {
      icon: "🚀",
      title: "Growth",
      description: "Continuous learning and development for all members",
    },
    {
      icon: "🌟",
      title: "Excellence",
      description: "Striving for quality in everything we create",
    },
  ];

  const teamMembers = [
    "https://media.licdn.com/dms/image/v2/D4D03AQEOBVyo_6WEfA/profile-displayphoto-scale_400_400/B4DZnXX7eLHsAg-/0/1760255005521?e=1764201600&v=beta&t=D5FnZeZbXTQKVBJHh9f2-oGyxKAKZVmDA30YB9qW0Hc",
    "https://media.licdn.com/dms/image/v2/D5635AQHH0c4L15sfqw/profile-framedphoto-shrink_400_400/B56Zfl.e.tHoAg-/0/1751910052068?e=1763359200&v=beta&t=MRb5sdffjPqrSXtsJ4wERO3a7Vi1el8G1qXtNG_RIck",
    "https://media.licdn.com/dms/image/v2/D4D03AQF0kgyOG-6Cgw/profile-displayphoto-crop_800_800/B4DZpyW.XYJcAI-/0/1762855218734?e=1764806400&v=beta&t=LqCg8oN2J9swhyKEAZ75AFIjd52cGbscM0W3nml0sNU",
    "https://media.licdn.com/dms/image/v2/D4E03AQEYrpsBXr8l8A/profile-displayphoto-shrink_800_800/B4EZXW84PWG0Ac-/0/1743068041136?e=1764806400&v=beta&t=wmZ-3zVlhTzq-_kQBPJgUC5Htt1mHM_zGXHRzkOjbv0",
    "https://media.licdn.com/dms/image/v2/D5603AQFLDM_ENRFRCA/profile-displayphoto-scale_400_400/B56ZoNPY40KEAg-/0/1761158730093?e=1764201600&v=beta&t=O1px96p5cwLYnzpy-rTtjlL3nrvxvcUlhsQj1aXE1RY",
    "https://media.licdn.com/dms/image/v2/D4E03AQHGBQHEQ-VPDw/profile-displayphoto-scale_400_400/B4EZoMf5JUHgAg-/0/1761146284014?e=1764201600&v=beta&t=1rJj-aMGQ49FGvI-8IHOt0SXUFJBRzf8IxDa4qkRRrU",
    "https://media.licdn.com/dms/image/v2/D4E03AQHGBQHEQ-VPDw/profile-displayphoto-scale_400_400/B4EZoMf5JUHgAg-/0/1761146284014?e=1764201600&v=beta&t=1rJj-aMGQ49FGvI-8IHOt0SXUFJBRzf8IxDa4qkRRrU",
    "https://media.licdn.com/dms/image/v2/D4D03AQG5llJpsKO08g/profile-displayphoto-crop_800_800/B4DZpxle3_JAAI-/0/1762842244777?e=1764806400&v=beta&t=l_YJsAfROgaiT76lecYRitH5miQxa13cdnMnWx19LwI",
    "https://media.licdn.com/dms/image/v2/D5603AQEylPDYztC3Yg/profile-displayphoto-scale_400_400/B56Zp2IgHuG4Ag-/0/1762918533004?e=1764806400&v=beta&t=B4nStgIyRObd8JRlVH9yKF9kNSezBfWIrFGNfmEz6Bo",
    "https://media.licdn.com/dms/image/v2/D4D03AQGvZhLfFfsexQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1730187799821?e=1764806400&v=beta&t=5N7TEw_H4nj8pSIPocNh_up-ke5E-UKrzH5IwITw1Rk",
    "https://media.licdn.com/dms/image/v2/D4E03AQEGjffrIlXf7Q/profile-displayphoto-scale_400_400/B4EZofGW4KKcAg-/0/1761458353748?e=1764201600&v=beta&t=oodt2YCESjezc9YiJvnyxoO9NJIMkk3SbzSdcl6l4Yc",
    "https://media.licdn.com/dms/image/v2/D4E03AQHwiqK1TZOheg/profile-displayphoto-scale_400_400/B4EZpsTE32GUAg-/0/1762753534343?e=1764201600&v=beta&t=qNd_FiEoKHDpB_Bp3ytjqeWra509pe5IO8eIJzIw60k",
    "https://media.licdn.com/dms/image/v2/D4D03AQFf7_IcJBm8-Q/profile-displayphoto-scale_400_400/B4DZk.Q8_1HYAg-/0/1757686257157?e=1764806400&v=beta&t=HHwUmhBGNo1N_ObpRVUzzgA-f648Ld4e1S2PHDEePE4",
    "https://media.licdn.com/dms/image/v2/D4E35AQFDgmJyqCPwJA/profile-framedphoto-shrink_400_400/B4EZp21rXzHEAc-/0/1762930374458?e=1763582400&v=beta&t=c-RiNuqDmtZkNCikrG_af2dDY-j8NmduElh9uv0heSo",



  ];

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16 pb-10 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 relative py-6 sm:py-8 md:py-10">
        <div className="absolute top-0 left-1/4 w-48 sm:w-60 md:w-72 h-48 sm:h-60 md:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 right-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <h1 className={title({ size: "lg" })}>
            About{" "}
            <span className={title({ color: "violet", size: "lg" })}>
              Mind Mesh
            </span>
          </h1>
          <p className={subtitle({ class: "mt-3 sm:mt-4 md:mt-5 lg:mt-6 max-w-2xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg" })}>
            A community where ideas connect, creativity flourishes, and innovation thrives
          </p>
        </div>
      </div>


      {/* Story Section */}
      <Card className="border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 max-w-7xl mx-auto w-full" shadow="lg">
        <CardBody className="p-4 sm:p-6 md:p-8 lg:p-12 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          <h2 className={title({ size: "sm" })}>Our Story</h2>
          <p className="text-default-600 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
            Mind Mesh was founded with a simple yet powerful vision: to create a space where 
            passionate individuals could come together, share ideas, and build something extraordinary. 
            What started as a small group of friends has grown into a thriving community of innovators, 
            creators, and dreamers.
          </p>
          <p className="text-default-600 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
            We believe that the best ideas emerge when diverse minds collaborate. Our club brings 
            together students from various backgrounds, each contributing their unique perspective 
            to create something greater than the sum of its parts.
          </p>
        </CardBody>
      </Card>

      {/* Values Grid */}
      <div className="max-w-7xl mx-auto w-full">
        <h2 className={title({ size: "sm", class: "text-center mb-6 sm:mb-7 md:mb-8 lg:mb-10" })}>
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {values.map((value, index) => (
            <Card
              key={index}
              className="border-none hover:scale-105 transition-all duration-300 hover:shadow-xl"
              shadow="sm"
            >
              <CardBody className="p-4 sm:p-5 md:p-6 lg:p-8">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{value.icon}</div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2">{value.title}</h3>
                    <p className="text-default-600 text-xs sm:text-sm md:text-base">{value.description}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <Card className="border-none bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 max-w-7xl mx-auto w-full" shadow="lg">
        <CardBody className="p-4 sm:p-6 md:p-8 lg:p-12 text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          <h2 className={title({ size: "sm" })}>Meet Our Team</h2>
          <p className="text-default-600 text-xs sm:text-sm md:text-base lg:text-lg">
            Passionate leaders driving innovation and growth
          </p>
          <div className="flex justify-center">
            <AvatarGroup isBordered max={5} size="lg">
              {teamMembers.map((avatar, index) => (
                <Avatar key={index} src={avatar} />
              ))}
            </AvatarGroup>
          </div>
          <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 mt-4 sm:mt-5 md:mt-6 flex-wrap">
            <Chip color="primary" variant="flat" className="text-xs sm:text-sm">Leadership</Chip>
            <Chip color="secondary" variant="flat" className="text-xs sm:text-sm">Innovation</Chip>
            <Chip color="success" variant="flat" className="text-xs sm:text-sm">Creativity</Chip>
            <Chip color="warning" variant="flat" className="text-xs sm:text-sm">Excellence</Chip>
          </div>
        </CardBody>
      </Card>

     
    </div>
  );
}