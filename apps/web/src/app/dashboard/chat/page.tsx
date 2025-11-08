"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ChatResponse } from "@/lib/api";
import { Send, Copy, Download, Trash2 } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  data?: ChatResponse;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat-messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      setMessages([]);
      localStorage.removeItem("chat-messages");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.chatWithData(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Query executed successfully. Found ${response.rows.length} results.`,
        data: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Error: ${error.message || "Failed to process query"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
  };

  const exportCSV = (data: ChatResponse) => {
    if (!data.rows.length) return;

    const headers = data.columns.join(",");
    const rows = data.rows
      .map((row) => data.columns.map((col) => JSON.stringify(row[col] ?? "")).join(","))
      .join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat with Data</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ask questions about your invoice data in natural language
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-white rounded-lg p-4 shadow-sm">
        {messages.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">
              💡 Get Started with Natural Language Queries
            </h3>
            <p className="text-blue-700 text-xs mb-2">Try asking:</p>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• "What's the total spend?"</li>
              <li>• "List top 5 vendors by spend"</li>
              <li>• "Show me all invoices from October 2025"</li>
              <li>• "Which vendor has the highest total spend?"</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {message.type === "user" ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-2xl text-sm">
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-gray-100 px-4 py-2 rounded-lg max-w-4xl text-sm text-gray-700">
                  {message.content}
                </div>

                {message.data && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700">Generated SQL</h4>
                      <button
                        onClick={() => copySQL(message.data!.sql)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                      {message.data.sql}
                    </pre>
                  </div>
                )}

                {message.data && message.data.rows.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700">
                        Results ({message.data.rows.length} rows)
                      </h4>
                      <button
                        onClick={() => exportCSV(message.data!)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-3 h-3" />
                        Export CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b sticky top-0">
                          <tr>
                            {message.data.columns.map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left font-medium text-gray-700"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {message.data.rows.slice(0, 100).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {message.data!.columns.map((col) => (
                                <td key={col} className="px-3 py-2 text-gray-900">
                                  {String(row[col] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {message.data.rows.length > 100 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing first 100 of {message.data.rows.length} results
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
                <span className="text-xs text-gray-600 ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
