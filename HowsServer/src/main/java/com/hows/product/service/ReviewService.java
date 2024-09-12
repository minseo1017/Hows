package com.hows.product.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hows.product.dao.ReviewDAO;
import com.hows.product.dto.ImageDTO;
import com.hows.product.dto.ReviewDTO;
import com.hows.product.dto.ReviewReportDTO;

@Service
public class ReviewService {

	@Autowired
	private ReviewDAO reviewDAO;

	// 리뷰 저장
	public int saveReview(int rating, String reviewContents, int productSeq, String memberId) throws Exception {
		ReviewDTO review = new ReviewDTO();
		review.setRating(rating);
		review.setReview_contents(reviewContents);
		review.setProduct_seq(productSeq);
		review.setMember_id(memberId);

		reviewDAO.insertReview(review);
		
		review.setReview_seq(reviewDAO.selectLastReviewSeq());
		
		return review.getReview_seq();
	}
	
	// 리뷰 목록 출력
	public List<Map<String, Object>>  getReviewList(int product_seq) throws Exception{
		System.out.println("getReviewList serv");
		
		return reviewDAO.getReviewList(product_seq);
	}
	
	// 관리자
	// 리뷰 신고목록 조회 (관리자)
	public List<Map<String, Object>> getReportedReviews(int page, int itemsPerPage) throws Exception {
        // 페이징을 위한 startRow, endRow 계산
        int startRow = (page - 1) * itemsPerPage + 1;
        int endRow = page * itemsPerPage;

        return reviewDAO.getReportedReviews(startRow, endRow);
    }

    // 전체 신고 리뷰 카운트 조회
    public int getReportedReviewsCount() throws Exception {
        return reviewDAO.getReportedReviewsCount();
    }

	// 리뷰 신고내역 조회 (관리자)
	public List<ReviewReportDTO> getReviewReport(int review_seq) throws Exception {
		List<ReviewReportDTO> reviewReports = reviewDAO.getReviewReport(review_seq);
		System.out.println("서비스 : " + review_seq + ": " + reviewReports);
		return reviewReports;
	}

	// 신고 리뷰 삭제 (관리자)
	@Transactional
    public int deleteReview(int review_seq) throws Exception {
        // 신고 기록 삭제
        reviewDAO.deleteReviewReport(review_seq);
        // 리뷰 삭제
        return reviewDAO.deleteReview(review_seq);
    }
	
	public void insertReviewImage(ImageDTO imageDTO) throws Exception {
		reviewDAO.insertReviewImage(imageDTO);
	}
	
	public int selectLastReviewSeq() throws Exception {
		return reviewDAO.selectLastReviewSeq();
	}
}
