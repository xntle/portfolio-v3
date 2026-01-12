"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello there. You can ask me about my work, or just talk to me about your day and get to know me outside of my work :-)",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatRef.current &&
        !chatRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages: Message[] = [
      ...messages,
      userMessage,
      { role: "assistant", content: "responding..." },
    ];
    setMessages(updatedMessages);

    setInput("");

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, userMessage]),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body from server.");

      // Clear "responding..." before streaming actual response
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role !== "assistant") return prev;

          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + chunk },
          ];
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "sorry i ran out of credits :-( but you can still talk to human an here on linkedin, with my linkedin tag im sure hell answer your questions better than me!",
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans flex flex-col items-end">
      <motion.div
        ref={chatRef}
        layout
        className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden ${
          isOpen
            ? "rounded-3xl p-5"
            : "rounded-full p-1 cursor-pointer hover:opacity-90 hover:-translate-y-1"
        }`}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={() => !isOpen && setIsOpen(true)}
      >
        <AnimatePresence mode="popLayout">
          {!isOpen ? (
            <motion.div
              key="trigger"
              className="flex items-center gap-2 pr-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/avatar.png"
                alt="Chat Avatar"
                width={40}
                height={40}
                className="rounded-full border dark:border-zinc-700"
              />
              <span className="text-sm font-medium dark:text-zinc-200 whitespace-nowrap">
                an ai (beta)
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="chat-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col h-full w-[90vw] sm:w-[50vh]"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold dark:text-white">
                  an ai <span className="text-gray-600 dark:text-zinc-500 font-normal">(beta)</span>:
                </h2>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 max-h-80 overflow-y-auto space-y-2 text-sm pr-1 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 mb-3">
                {messages.map((msg, i) => (
                  <p
                    key={i}
                    className={`${
                      msg.role === "assistant"
                        ? "text-gray-800 dark:text-zinc-300 italic"
                        : "text-right text-black dark:text-white"
                    }`}
                  >
                    {msg.content}
                  </p>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center space-x-2 border-t dark:border-zinc-800 pt-2">
                <input
                  type="text"
                  placeholder="ask me :-)"
                  className="w-full text-sm text-black dark:text-white bg-transparent placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <AnimatePresence>
                  {input.trim() && (
                    <motion.button
                      onClick={sendMessage}
                      className="text-sm px-2 py-1 text-blue-600 dark:text-blue-400 hover:underline"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      send
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="mt-3 text-xs text-gray-700 dark:text-zinc-500 flex justify-between">
                <span>rather talk to human An?</span>
                <div className="space-x-2">
                  <Link
                    href="mailto:thaianle.work@gmail.com"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    mail
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/thai-an-le/"
                    target="_blank"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    linkedin
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Chat;
