import React from "react";
import Link from "next/link";
import Image from "next/image";

const travelOptions = [
  {
    title: "Abu Dhabi",
    description:
      "Capital of the UAE, known for opulent architecture and rich culture.",
    img: "/assets/hero/abu-dhabi-city.jpg",
    link: "/destinations/uae/abu-dhabi",
  },
  {
    title: "Dubai",
    description:
      "Glamorous city in the UAE, famous for its futuristic skyline and vibrant lifestyle.",
    img: "/assets/poster/event-burj-khalifa1.jpg",
    link: "/destinations/uae/dubai",
  },
  {
    title: "Fujairah",
    description:
      "UAE's eastern emirate, known for its stunning coastline and historical sites.",
    img: "/assets/destinations/fujairah-castle.jpg",
    link: "/destinations/uae/fujairah",
  },
  {
    title: "Ras Al Khaimah",
    description:
      "UAE's northern emirate, known for its natural beauty and historical landmarks.",
    img: "/assets/destinations/ras-al-khaimah.jpg",
    link: "/destinations/uae/ras-al-khaimah",
  },
];

const Discovery = () => {
  return (
    <div className="bg-linear-to-b from-[#f2836f]/10 via-[#ffffff] to-[#ffffff] text-gray-700">
      <div className="max-w-6xl mx-auto flex flex-col gap-10 py-20 px-8 md:px-10 xl:px-0">
        <div className="flex flex-col justify-center gap-2">
          <label
            htmlFor=""
            className="text-sm lg:text-base font-semibold"
          >
            WHERE TIME-HONORED TRADITIONS EMBRACE THE FUTURE!
          </label>
          <h2 className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-teal-600">
            Discover the UAE
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] duration-1000 transition-transform gap-4 ">
          {travelOptions.map((option, index) => (
            <div
              key={index}
              className="relative rounded-4xl overflow-hidden h-[55vh] group shadow-lg"
            >
              <Image
                src={option.img}
                alt={option.title}
                fill
                className="grid hover:grid-cols-[1fr_2fr] absolute inset-0 w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-125"
              />

              <div className="absolute inset-0 bg-black/64 lg:bg-[#f2836f]/15 group-hover:bg-black/64 transition-all duration-1000"></div>

              <div className="relative z-10 h-full flex flex-col items-start text-start justify-end gap-3 p-8 md:p-10 text-white">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor=""
                    className="text-xs md:text-sm font-semibold text-[#f2836f] duration-700"
                  >
                    TEXT HERE
                  </label>
                  <h2 className="playfair text-2xl md:text-xl xl:text-3xl font-bold">
                    {option.title}
                  </h2>
                </div>
                <p className="text-xs 2xl:text-sm font-semibold text-gray-200 line-clamp-3">
                  {option.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <Link
                    href={option.link}
                    className="select-none btn-godual-sm btn-dynamic"
                  >
                    See More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Discovery;
