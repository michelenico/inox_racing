import Link from "next/link";
import type { FeedPost } from "@/lib/feed";
import { mediaUrl, timeAgo } from "@/lib/media";
import { FollowButton } from "./FollowButton";
import { IconVerified } from "./Icons";
import { Reactions } from "./Reactions";

export function PostCard({ post, viewerId }: { post: FeedPost; viewerId: string | null }) {
  const cover = post.media[0];
  const avatar = mediaUrl(post.author.avatar_key);
  const isMine = viewerId === post.author.id;

  return (
    <article className="post">
      <div className="post-frame">
      {cover ? (
        cover.kind === "video" ? (
          <video className="post-media" src={mediaUrl(cover.storage_key)!} muted playsInline loop autoPlay preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="post-media" src={mediaUrl(cover.storage_key)!} alt={post.vehicle ? `${post.vehicle.make} ${post.vehicle.model}` : "Foto del post"} loading="lazy" />
        )
      ) : (
        <div className="post-media-empty" />
      )}

      <div className="post-head glass">
        <Link href={`/garage/${post.author.username}`} style={{ display: "contents" }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={`avatar ${post.author.is_verified_customer ? "avatar-verified" : ""}`} src={avatar} alt="" />
          ) : (
            <span className={`avatar ${post.author.is_verified_customer ? "avatar-verified" : ""}`} />
          )}
          <span className="post-author">
            <strong>
              {post.author.display_name}
              {post.author.is_verified_customer && <IconVerified />}
            </strong>
            <span className="post-meta">
              {timeAgo(post.created_at)}
              {post.city ? `, ${post.city}` : ""}
            </span>
          </span>
        </Link>
        {!isMine && <FollowButton profileId={post.author.id} following={post.following} loggedIn={!!viewerId} />}
      </div>

      <div className="post-foot">
        {post.vehicle && <span className="tag glass">{post.vehicle.make} {post.vehicle.model}</span>}
        <Reactions postId={post.id} myReaction={post.myReaction} counts={post.reactions} saved={post.saved} loggedIn={!!viewerId} />
      </div>
      </div>
      {post.caption && <p className="caption">{post.caption}</p>}
    </article>
  );
}
