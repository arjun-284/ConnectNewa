import React, { useEffect, useState } from "react";
import Navigation from "../../Components/Navigation";
import axios from "axios";

function Community() {
  const [posts, setPosts] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});
  const [descExpand, setDescExpand] = useState({});
  const [commentExpand, setCommentExpand] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch posts
  const fetchPosts = async () => {
    const res = await axios.get("http://localhost:5000/api/contributors/all");
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Like, dislike, comment, reply handlers (same as before)
  const handleLike = async (id) => {
    const post = posts.find((p) => p._id === id);
    if (!user || !post) return;
    if ((post.likes || []).includes(user._id) || (post.dislikes || []).includes(user._id)) return;
    await axios.post(`http://localhost:5000/api/contributors/like/${id}`, { userId: user._id });
    fetchPosts();
  };

  const handleDislike = async (id) => {
    const post = posts.find((p) => p._id === id);
    if (!user || !post) return;
    if ((post.likes || []).includes(user._id) || (post.dislikes || []).includes(user._id)) return;
    await axios.post(`http://localhost:5000/api/contributors/dislike/${id}`, { userId: user._id });
    fetchPosts();
  };

  const handleComment = async (id) => {
    if (!commentInput[id]?.trim()) return;
    await axios.post(`http://localhost:5000/api/contributors/comment/${id}`, {
      userId: user._id,
      text: commentInput[id],
    });
    fetchPosts();
    setCommentInput((inp) => ({ ...inp, [id]: "" }));
  };

  const handleReply = async (postId, idx) => {
    const replyKey = `${postId}_${idx}`;
    const replyText = replyInput[replyKey]?.trim();
    if (!replyText) return;
    await axios.post(`http://localhost:5000/api/contributors/reply/${postId}`, {
      commentIndex: idx,
      userId: user._id,
      text: replyText,
    });
    fetchPosts();
    setReplyInput((inp) => ({ ...inp, [replyKey]: "" }));
  };

  const handleLikeComment = async (postId, commentId) => {
    if (!user) return;
    await axios.post(`http://localhost:5000/api/contributors/like-comment/${postId}/${commentId}`, {
      userId: user._id,
    });
    fetchPosts();
  };

  const handleDislikeComment = async (postId, commentId) => {
    if (!user) return;
    await axios.post(`http://localhost:5000/api/contributors/dislike-comment/${postId}/${commentId}`, {
      userId: user._id,
    });
    fetchPosts();
  };

  const isCommentLiked = (comment) => (comment.likes || []).includes(user?._id);
  const isCommentDisliked = (comment) => (comment.dislikes || []).includes(user?._id);
  const isLiked = (post) => (post.likes || []).includes(user?._id);
  const isDisliked = (post) => (post.dislikes || []).includes(user?._id);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-[#ece9e6] to-[#fffdfa] py-10 px-3 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-[#9C1322] mb-12 text-center drop-shadow">
          Community <span className="text-black">Dreams</span>
        </h1>
        <div className="w-full flex flex-wrap justify-center gap-10">
          {posts
            .filter((post) => post.status === "approved")
            .map((post) => {
              const descTooLong = (post.body || "").length > 180;
              const descShown = descExpand[post._id]
                ? post.body
                : (post.body || "").slice(0, 180) + (descTooLong ? "..." : "");
              const comments = post.comments || [];
              const showAllComments = commentExpand[post._id];
              const commentsToShow = showAllComments ? comments : comments.slice(0, 3);

              return (
                <div
                  key={post._id}
                  className="w-full sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-[#ffe3e3] mb-6 overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  {post.mediaUrl && (
                    <img
                      src={`http://localhost:5000${post.mediaUrl}`}
                      className="w-full h-56 object-cover border-b border-gray-100"
                      alt="media"
                    />
                  )}
                  {/* Author */}
                  <div className="flex items-center gap-3 px-6 pt-6 pb-3 border-b border-gray-100">
                    {post.submittedBy?.avatar ? (
                      <img
                        src={post.submittedBy.avatar}
                        alt="Profile"
                        className="w-11 h-11 rounded-full border-2 border-[#9C1322]"
                      />
                    ) : (
                      <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#9C1322] text-white text-xl font-bold border-2 border-[#9C1322]">
                        {(post.submittedBy?.name || "C")[0]}
                      </div>
                    )}
                    <span className="text-base font-bold text-[#9C1322] tracking-wide">
                      {post.submittedBy?.name || "Contributor"}
                    </span>
                  </div>
                  {/* Title + Body */}
                  <div className="px-6 py-3">
                    <h2 className="font-bold text-2xl text-[#9C1322] mb-2">{post.title}</h2>
                    <div className="text-gray-700 mb-3 text-lg whitespace-pre-line">
                      {descShown}
                      {descTooLong && (
                        <button
                          className="ml-2 text-blue-600 underline text-sm"
                          onClick={() =>
                            setDescExpand((prev) => ({
                              ...prev,
                              [post._id]: !prev[post._id],
                            }))
                          }
                        >
                          {descExpand[post._id] ? "See less" : "See more"}
                        </button>
                      )}
                    </div>
                    {/* Like/Dislike */}
                    <div className="flex gap-4 items-center text-sm mb-2">
                      <button
                        onClick={() => handleLike(post._id)}
                        disabled={isLiked(post) || isDisliked(post)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition
                          shadow-sm border
                          ${isLiked(post)
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                        `}
                      >
                        👍 {post.likes?.length || 0}
                      </button>
                      <button
                        onClick={() => handleDislike(post._id)}
                        disabled={isLiked(post) || isDisliked(post)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition
                          shadow-sm border
                          ${isDisliked(post)
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "text-red-600 border-red-200 hover:bg-red-50"}
                        `}
                      >
                        👎 {post.dislikes?.length || 0}
                      </button>
                    </div>
                  </div>
                  {/* Comments */}
                  <div className="px-6 py-5 border-t border-gray-100 bg-[#faf7f7]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#9C1322] font-bold text-base">
                        💬 {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="text"
                        value={commentInput[post._id] || ""}
                        placeholder="Add a comment..."
                        onChange={(e) =>
                          setCommentInput((inp) => ({ ...inp, [post._id]: e.target.value }))
                        }
                        className="border rounded-full px-3 py-2 flex-1 focus:ring-2 focus:ring-[#9C1322] transition text-sm"
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="bg-[#9C1322] text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-[#b91c1c] transition"
                      >
                        Comment
                      </button>
                    </div>
                    <div className="space-y-5 text-sm">
                      {commentsToShow.length === 0 && (
                        <div className="text-gray-400 italic text-xs">No comments yet.</div>
                      )}
                      {commentsToShow.map((c, idx) => (
                        <div key={c._id || idx} className="bg-white border-l-4 border-[#9C1322] p-3 rounded-lg mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            {c.user?.avatar ? (
                              <img
                                src={c.user.avatar}
                                alt="Profile"
                                className="w-7 h-7 rounded-full border border-indigo-600"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-center font-bold text-sm flex items-center justify-center">
                                {(c.user?.name || "U")[0]}
                              </span>
                            )}
                            <b className="text-indigo-700">{c.user?.name || "User"}</b>
                            <span className="ml-1 text-gray-700 flex-1">{c.text}</span>
                            {/* Like/Dislike for comments */}
                            <button
                              onClick={() => handleLikeComment(post._id, c._id)}
                              disabled={isCommentLiked(c) || isCommentDisliked(c)}
                              className={`ml-2 px-2 py-1 rounded-full font-bold text-xs border transition
                                ${isCommentLiked(c)
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                              `}
                            >
                              👍 {c.likes?.length || 0}
                            </button>
                            <button
                              onClick={() => handleDislikeComment(post._id, c._id)}
                              disabled={isCommentLiked(c) || isCommentDisliked(c)}
                              className={`px-2 py-1 rounded-full font-bold text-xs border transition
                                ${isCommentDisliked(c)
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "text-red-600 border-red-200 hover:bg-red-50"}
                              `}
                            >
                              👎 {c.dislikes?.length || 0}
                            </button>
                          </div>
                          {/* Replies */}
                          <div className="ml-8 mt-2 space-y-1">
                            {(c.replies || []).map((r, ridx) => (
                              <div
                                key={r._id || ridx}
                                className="flex items-center gap-2 text-gray-700"
                              >
                                {r.user?.avatar ? (
                                  <img
                                    src={r.user.avatar}
                                    alt="Profile"
                                    className="w-6 h-6 rounded-full border border-green-600"
                                  />
                                ) : (
                                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-center font-semibold text-xs flex items-center justify-center">
                                    {(r.user?.name || "U")[0]}
                                  </span>
                                )}
                                <span className="font-semibold text-green-700">{r.user?.name || "User"}:</span>
                                <span>{r.text}</span>
                              </div>
                            ))}
                            {/* Reply input */}
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Reply..."
                                value={replyInput[`${post._id}_${idx}`] || ""}
                                onChange={(e) =>
                                  setReplyInput((inp) => ({
                                    ...inp,
                                    [`${post._id}_${idx}`]: e.target.value,
                                  }))
                                }
                                className="border px-2 py-1 rounded-full text-xs focus:ring-2 focus:ring-green-500 transition"
                              />
                              <button
                                onClick={() => handleReply(post._id, idx)}
                                className="bg-green-500 text-white rounded-full px-3 py-1 text-xs font-semibold hover:bg-green-700 transition"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* --- SEE MORE / LESS LOGIC --- */}
                      {!showAllComments && comments.length > 3 && (
                        <button
                          className="text-blue-600 underline text-xs mt-2"
                          onClick={() =>
                            setCommentExpand((prev) => ({
                              ...prev,
                              [post._id]: true,
                            }))
                          }
                        >
                          See more comments ({comments.length})
                        </button>
                      )}
                      {showAllComments && comments.length > 3 && (
                        <button
                          className="text-blue-600 underline text-xs mt-2"
                          onClick={() =>
                            setCommentExpand((prev) => ({
                              ...prev,
                              [post._id]: false,
                            }))
                          }
                        >
                          See less comments
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default Community;
