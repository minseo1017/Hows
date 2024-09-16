package com.hows.product.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hows.product.service.LikesService;

@RestController
@RequestMapping("/likes")
public class LikesController {
	@Autowired
	private LikesService likesServ;
	
	// 상품 좋아요 추가
    @PostMapping("/insert")
    public ResponseEntity<String> addLike(@RequestBody Map<String, Object> requestData) 
    throws Exception{
    	 int product_seq = Integer.parseInt(requestData.get("product_seq").toString());
         String member_id = (String) requestData.get("member_id");

         likesServ.addLike(product_seq, member_id);
         return ResponseEntity.ok("Like");
    }
    
    // 상품 좋아요 취소
    @DeleteMapping("/delete")
    public ResponseEntity<String> removeLike(@RequestBody Map<String, Object> requestData) 
    throws Exception{
        int product_seq = Integer.parseInt(requestData.get("product_seq").toString());
        String member_id = (String) requestData.get("member_id");

        likesServ.removeLike(product_seq, member_id);
        return ResponseEntity.ok("Like removed");
    }
    
    // 상품 좋아요 개수 조회
    @GetMapping("/count")
    public ResponseEntity<Integer> getLikeCount(
    		@RequestParam("product_seq") int product_seq) 
    throws Exception{
        int likeCount = likesServ.getLikeCount(product_seq);
        return ResponseEntity.ok(likeCount);
    }
    
    // 상품 좋아요 확인
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkLikeStatus(
    		@RequestParam("product_seq") int product_seq,
            @RequestParam("member_id") String member_id) 
    throws Exception{
    	
    	// 로그인하지 않은 상태일 때 처리
    	if (member_id == null || member_id.isEmpty()) {
            System.out.println("로그인하지 않은 사용자입니다.");
            return ResponseEntity.ok(false); // 좋아요 상태가 false로 전달
        }

    	
        boolean isLiked = likesServ.isLiked(product_seq, member_id);
        return ResponseEntity.ok(isLiked);
    }
    
    
    // 리뷰 좋아요 추가
    @PostMapping("/review/insert")
    public ResponseEntity<String> addReviewLike(@RequestBody Map<String, Object> requestData) 
    throws Exception {
        int review_seq = Integer.parseInt(requestData.get("review_seq").toString());
        String member_id = (String) requestData.get("member_id");

        likesServ.addReviewLike(review_seq, member_id);
        return ResponseEntity.ok("Review liked");
    }

    // 리뷰 좋아요 취소
    @DeleteMapping("/review/delete")
    public ResponseEntity<String> removeReviewLike(@RequestBody Map<String, Object> requestData) 
    throws Exception {
        int review_seq = Integer.parseInt(requestData.get("review_seq").toString());
        String member_id = (String) requestData.get("member_id");

        likesServ.removeReviewLike(review_seq, member_id);
        return ResponseEntity.ok("Review like removed");
    }

    // 리뷰 좋아요 개수 조회
    @GetMapping("/review/count")
    public ResponseEntity<Integer> getReviewLikeCount(
        @RequestParam("review_seq") int review_seq) 
    throws Exception {
        int likeCount = likesServ.getReviewLikeCount(review_seq);
        return ResponseEntity.ok(likeCount);
    }

    // 리뷰 좋아요 확인
    @GetMapping("/review/check")
    public ResponseEntity<Boolean> checkReviewLikeStatus(
        @RequestParam("review_seq") int review_seq,
        @RequestParam("member_id") String member_id) 
    throws Exception {
        boolean isLiked = likesServ.isReviewLiked(review_seq, member_id);
        return ResponseEntity.ok(isLiked);
    }

    
    
    
    // 예외 처리
	@ExceptionHandler(Exception.class)
	public ResponseEntity<String> exceptionHandler(Exception e) {
		e.printStackTrace();
		return ResponseEntity.badRequest().body("fail");
	}
	
}
