"use client";
import Avatar from "./ui/Avatar";

const Hero = () => {
  return (
    <div className="flex flex-col mt-20 items-center mb-8">
      {/* Profile Section */}
      <div className="text-center mt-8">
        <Avatar />
      </div>
      {/* Name and Title */}
      <h1 className="text-5xl font-bold mt-5">Thai An (An) Le</h1>
      <p className="text-2xl font-light text-gray-600 dark:text-zinc-400 mt-1">
        software engineer
      </p>

      {/* Introduction Message */}
      <div className="text-sm text-center text-gray-600 dark:text-zinc-300 mt-4 px-6 py-3 border dark:border-zinc-700 rounded-full max-w-xl">
        hey there, welcome to my portfolio :-). I am a passionate builder,
        creative problem solver, and lifelong learner.
      </div>
    </div>
  );
};

export default Hero;
