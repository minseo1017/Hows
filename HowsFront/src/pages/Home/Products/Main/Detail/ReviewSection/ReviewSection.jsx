import { useEffect, useState } from 'react';
import styles from './ReviewSection.module.css'
import axios from 'axios';
import Swal from "sweetalert2";
import img from '../../../../../../assets/images/마이페이지_프로필사진.jpg'
import StarRating from '../../../../../../components/StarRating/StarRating';
import { Modal } from '../../../../../../components/Modal/Modal';
import { api, host } from '../../../../../../config/config';
import { formatDate } from '../../../../../../commons/commons'
import { Paging } from '../../../../../../components/Pagination/Paging';
import { userInfo } from '../../../../../../api/member' 
import { getReviewList , getReviewImgList , reviewLike, reviewUnlike , getReviewLikeCount , checkReviewLikeStatus } from '../../../../../../api/product';

export const ReviewSection = ({ product_seq, isAuth }) => {
    const memberId = sessionStorage.getItem("member_id");
    
    // 모달창
    const [ isModalOpen, setIsModalOpen ] = useState(false);

    // 별점 상태, 리뷰 내용, 상품 번호를 URL에서 가져온 현재 product_seq 로 설정, 이미지 URL
    const [data, setData] = useState({rating: 0, review_contents: '', product_seq: product_seq, image_url: [],});
    
    // 리뷰 목록
    const [ reviews,setReviews ] = useState([]); // 리뷰 목록

    // 페이지네이션
    const [ page, setPage ] = useState(1) // 현재 페이지
    const [ itemsPerPage ] = useState(10)  // 페이지당 항목 수
    const [ totalReviews, setTotalReviews ] = useState(0) // 전체 리뷰 개수 

    // 평균 별점
    const [ averageRating, setAverageRating ] = useState(0);
    const [ ratingsCount, setRatingsCount ] = useState({5: 0,4: 0,3: 0,2: 0,1: 0});

    // 제출 중 여부
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    // 이미지 미리보기 URL을 저장 
    const [ previewImages, setPreviewImages ] = useState([]);
    
    // 각 리뷰 작성자의 프로필 이미지를 저장
    const [reviewAvatars, setReviewAvatars] = useState({}); 

    // 좋아요 상태 관리
    const [liked, setLiked] = useState({});
    const [likeCount, setLikeCount] = useState({});


    // 모달창 열기 및 닫기 (상태 초기화 작업)
    const handleOpenModal = () => {
        setData({rating: 0, review_contents: '', product_seq:product_seq, images: []});
        setPreviewImages([]);  
        setIsModalOpen(true); 
    };
    const handleCloseModal = () => setIsModalOpen(false);

    // 별점 변경 시 호출되는 함수
    const handleRatingChange = (newRating) => {
        setData((prevData) => ({
            ...prevData,
            rating: newRating, 
        }));
    };

    // 리뷰 내용 변경 함수
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // [리뷰 작성] 이미지 선택
    const handleImageChange = (event) => {
        const files = event.target.files;
        if (files) {
            // 파일 수가 4개를 초과하면 경고 메시지 표시
            if (files.length > 4 || (data.images && data.images.length + files.length > 4)) {
                Swal.fire({
                    icon: "warning",
                    title: "최대 4개의 파일만 선택할 수 있습니다.",
                    showConfirmButton: true,
                });
                return;
            }
    
            // 새로 선택한 파일들을 URL로 변환하여 미리보기 배열에 추가
            const newPreviewImages = Array.from(files).map(file => URL.createObjectURL(file));

            // 기존 이미지들과 새로 선택한 이미지를 병합하여 상태 업데이트
            setPreviewImages((prevImages) => [...prevImages, ...newPreviewImages]);

            // 기존 이미지들과 새로 선택한 이미지를 병합하여 상태에 저장
            setData(prevData => ({
                ...prevData, // 기존 데이터는 유지하고
                images: [...(prevData.images || []), ...Array.from(files)] // 이미지 배열 업데이트
            }));
        }
    };

    // [리뷰 작성] 이미지 제거 
    const handleRemoveImage = (index) => {

        // 이미지 URL을 미리보기 배열에서 제거
        setPreviewImages((prevImages) => prevImages.filter((_, i) => i !== index));
    
        // 이미지 파일을 data.images에서 제거
        setData((prevData) => ({
            ...prevData, // 기존의 데이터는 유지하고
            images: prevData.images.filter((_, i) => i !== index) // 선택된 이미지만 삭제
        }));
    };
    // 선택한 이미지들을 미리보기에 표시하는 함수 (배열에 저장된 이미지 URL을 기반으로 렌더링)
    const renderPreviewImages = () => {
        return previewImages.map((src, index) => (
            <div key={index} className={styles.previewImageContainer}>
                {/* 이미지 미리보기 */}
                <img src={src} alt={`preview ${index}`} className={styles.previewImage} />

                {/* 이미지 삭제 버튼: 클릭 시 handleRemoveImage 함수 호출 */}
                <button 
                    className={styles.deleteButton} 
                    onClick={() => handleRemoveImage(index)} // 이미지 제거 함수 호출
                >
                    X
                </button>
            </div>
        ));
    };
    
    
    // 모든 필드를 입력했는지 검사
    const isFormValid = () => {
        const { rating, review_contents, images } = data;
        return rating && review_contents && images && images.length > 0;
    };

    // 리뷰 등록 함수 
    const handleSubmit = () => {
        if (isSubmitting) return;
    
        setIsSubmitting(true);
    
        if (!isFormValid()) {
            alert('별점, 리뷰 내용, 그리고 이미지를 모두 입력해 주세요.');
            setIsSubmitting(false);
            return;
        }
    
        const formData = new FormData();
    
        const reviewData = JSON.stringify({
            rating: data.rating,
            review_contents: data.review_contents,
            product_seq: data.product_seq,
            member_id: memberId 
        });
        formData.append('reviewData', reviewData);
    
        if (data.images && data.images.length > 0) {
            data.images.forEach((image) => {
                formData.append('images', image); 
            });
        }
    
        data.images.forEach((_, index) =>
            formData.append('image_orders', index + 1)
        )
    
        api.post(`/product/reviewAdd`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((response) => {
            Swal.fire({
                icon: "success",
                title: "리뷰 제출에 성공했습니다.",
                showConfirmButton: true,
            });
    
            // 리뷰 등록 성공 시, 새 리뷰를 추가하여 리뷰 목록을 업데이트
            const newReview = {
                RATING: data.rating,
                REVIEW_CONTENTS: data.review_contents,
                MEMBER_ID: memberId,
                REVIEW_DATE: new Date(), // 현재 시간을 등록 시간으로 사용
                images: previewImages.map((src, index) => ({ IMAGE_URL: src })), // 이미지 미리보기 배열을 사용하여 새 리뷰 이미지로 추가
            };
            
            setReviews((prevReviews) => [newReview, ...prevReviews]); // 새 리뷰를 목록에 추가
            setTotalReviews(prevCount => prevCount + 1); // 전체 리뷰 수 업데이트
            setIsModalOpen(false); // 모달 닫기
            setIsSubmitting(false); // 제출 상태 해제
        }).catch((error) => {
            alert('리뷰 제출에 실패했습니다');
            setIsModalOpen(false);
            setIsSubmitting(false);
        });
    };
    
    

    // 리뷰 이미지 로딩 함수
    const loadReviewImages = async (reviewSeq) => {
        try {
            const response = await getReviewImgList(reviewSeq);
            return response.data.reviewImgs || [];
        } catch (error) {
            console.error('리뷰 이미지 불러오기 오류', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const resp = await getReviewList(product_seq, page, itemsPerPage, memberId);
                const reviewsData = resp.data.reviews;
    
                if (reviewsData.length > 0) {
                    // 각 리뷰에 이미지 데이터를 병합
                    const reviewsWithImages = await Promise.all(
                        // 각 리뷰에 연결된 이미지 배열 추가 
                        reviewsData.map(async (review) => {
                            const images = await loadReviewImages(review.REVIEW_SEQ);
                            return { ...review, images };
                        })
                    );
    
                    // 리뷰 작성자 프로필 이미지를 불러오는 부분
                    const avatarPromises = reviewsData.map(async (review) => {
                        // member_id가 null 또는 "null"이 아닌 경우에만 호출
                        if (review.MEMBER_ID && review.MEMBER_ID !== "null") { 
                            try {
                                // 프로필 이미지 API 호출
                                const profileResp = await userInfo(review.MEMBER_ID);
                                return { memberId: review.MEMBER_ID, avatar: profileResp.data.member_avatar };
                            } catch (error) {
                                console.error(`프로필 이미지를 불러오는 중 오류 발생: ${review.MEMBER_ID}`, error);
                                return { memberId: review.MEMBER_ID, avatar: img }; // 오류 발생 시 기본 이미지
                            }
                        } else {
                            return { memberId: review.MEMBER_ID, avatar: img };  // member_id가 없으면 기본 이미지 반환
                        }
                    });
                    const avatarData = await Promise.all(avatarPromises);

                    // 프로필 이미지를 상태로 저장
                    const avatarsMap = avatarData.reduce((acc, { memberId, avatar }) => {
                        // memberId를 키로, avatar(프로필 이미지)를 값으로 저장
                        acc[memberId] = avatar; 
                        return acc;
                    }, {});
    
                    // 프로필 이미지를 상태로 저장
                    setReviewAvatars(avatarsMap); 

                    // 리뷰 상태 및 총 리뷰 수 설정
                    setReviews(reviewsWithImages);
                    setTotalReviews(reviewsData[0].TOTAL_COUNT);
    
                    // 평균 별점 계산
                    const totalRating = reviewsData.reduce((acc, review) => acc + review.RATING, 0);
                    setAverageRating(totalRating / reviewsData.length);
    
                    // 별점 카운트 업데이트
                    const newRatingsCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                    reviewsData.forEach(review => newRatingsCount[review.RATING]++);
                    setRatingsCount(newRatingsCount);

                    // 각 리뷰의 좋아요 수를 가져옴 
                    const likePromises = reviewsData.map(async (review) => {
                        try {
                            const likeResp = await getReviewLikeCount(review.REVIEW_SEQ);
                            // console.log(likeResp.data);  

                            // likeResp.data 자체가 숫자일 경우 바로 반환
                            return { reviewSeq: review.REVIEW_SEQ, likeCount: likeResp.data || 0 };
                        } catch (error) {
                            return { reviewSeq: review.REVIEW_SEQ, likeCount: 0 }; // 오류 발생 시 기본값
                        }
                    });
                    const likeData = await Promise.all(likePromises);

                    const newLikeCount = {};
                    likeData.forEach(({ reviewSeq, likeCount }) => {
                        newLikeCount[reviewSeq] = likeCount; // 각 리뷰의 좋아요 수를 저장
                    });

                    setLikeCount(newLikeCount); // 좋아요 수 상태 업데이트
                }else {
                    setReviews([]);
                    setTotalReviews(0);
                    setAverageRating(0);
                    setRatingsCount({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
                }
            } catch (error) {
                console.error('리뷰 목록 불러오기 오류', error);
            }
        };
    
        fetchReviews();
    }, [product_seq, page, itemsPerPage]);

    // 페이지네이션
    const handlePageChange = (newPage) => {
        const startRow = (newPage - 1) * itemsPerPage + 1;
        const endRow = newPage * itemsPerPage;
        getReviewList(product_seq, startRow, endRow)
        .then(response => {
            setReviews(response.data.reviews);
            setTotalReviews(response.data.total_count);
        })
        .catch(error => {
            console.error('리뷰 목록 오류', error);
        });

    setPage(newPage);  // 페이지 상태 업데이트
    }


    // 리뷰 삭제
    const handleReviewDel = (review_seq) => {
        axios.delete(`${host}/product/delReview/${review_seq}`)
            .then(response => {
                console.log('리뷰 삭제 성공:', response.data);
                // 삭제된 리뷰를 제외하고 나머지 리뷰로 상태 업데이트
                setReviews(prevReviews => prevReviews.filter(review => review.REVIEW_SEQ !== review_seq));
                Swal.fire({
                    icon: "success",
                    title: "리뷰가 성공적으로 삭제되었습니다.",
                    showConfirmButton: true,
                });
            })
            .catch(error => {
                console.error('리뷰 삭제 실패:', error);
                Swal.fire({
                    icon: "error",
                    title: "리뷰 삭제에 실패했습니다.",
                    showConfirmButton: true,
                });
            });
    };

    // 리뷰 수정
    const handleModify = () => {

    }

    const handleReport = (reviewSeq) => {
        // 신고 요청을 서버로 보냄
        axios.post(`${host}/review/report/${reviewSeq}`, { memberId })
            .then(response => {
                Swal.fire("신고가 접수되었습니다.");
                // 추가적인 로직: UI 업데이트 등
            })
            .catch(error => {
                Swal.fire("신고에 실패했습니다.");
            });
    };


    // 리뷰 좋아요 '도움이 돼요'
    const handleLikeClick = (reviewSeq) => {
        if (!isAuth) {
            Swal.fire({
                icon: "warning",
                title: "로그인을 먼저 해주세요.",
                showConfirmButton: true,
            });
            return;
        }

        // 현재 리뷰에 좋아요가 없는 경우
        if (!liked[reviewSeq]) {
            // 좋아요 추가
            setLiked((prev) => ({ ...prev, [reviewSeq]: true }));
            setLikeCount((prev) => ({ ...prev, [reviewSeq]: (prev[reviewSeq] || 0) + 1 }));

            // 좋아요 요청 보내기
            reviewLike(reviewSeq, memberId)
                .then((resp) => {console.log('리뷰 좋아요 성공:', resp);})
                .catch((error) => {
                    console.error('리뷰 좋아요 추가 실패:', error);
                    // 좋아요 추가 실패 시 원상복구
                    setLiked((prev) => ({ ...prev, [reviewSeq]: false }));
                    setLikeCount((prev) => ({ ...prev, [reviewSeq]: (prev[reviewSeq] || 1) - 1 }));
                });
        } else {
            // 좋아요 취소
            setLiked((prev) => ({ ...prev, [reviewSeq]: false }));
            setLikeCount((prev) => ({ ...prev, [reviewSeq]: (prev[reviewSeq] || 1) - 1 }));

            // 좋아요 취소 요청 보내기
            reviewUnlike(reviewSeq, memberId)
                .then((resp) => {
                    console.log('리뷰 좋아요 취소 성공:', resp);
                })
                .catch((error) => {
                    console.error('리뷰 좋아요 취소 실패:', error);
                    // 실패 시 좋아요 상태 복구
                    setLiked((prev) => ({ ...prev, [reviewSeq]: true }));
                    setLikeCount((prev) => ({ ...prev, [reviewSeq]: (prev[reviewSeq] || 0) + 1 }));
                });
        }
    };

    return (
        <div className={styles.container}>
            {/* 상품 리뷰 내용 */}

            <div className={styles.reviewsBox}>
                <div className={styles.reviewsHeader}>
                    <div>리뷰 {reviews.length} </div>
                    
                    {isAuth ? (
                        // 로그인 상태일 때
                        <div onClick={handleOpenModal} style={{ cursor: 'pointer'}}>리뷰쓰기</div>
                    ) : (
                        // 로그인이 되어 있지 않을 때
                        <div>로그인 후 리뷰를 작성할 수 있습니다.</div>
                    )}

                    {/* 모달창 */}
                    <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                        <div className={styles.modalBox}>
                            <h2>리뷰 쓰기</h2>
                            <div>
                        <span>만족도 </span> &nbsp; &nbsp;
                                <StarRating 
                                    rating={data.rating} // 현재 별점 상태 전달
                                    onRatingChange={handleRatingChange} // 별점 변경 시 호출
                                />
                            </div>

                            <h2>리뷰 작성</h2>
                            <div className={styles.reviewModal}>
                                <input type='text' 
                                    name='review_contents' 
                                    placeholder='리뷰 내용을 입력하세요.' 
                                    value={data.review_contents} 
                                    onChange={handleInputChange}
                                    className={styles.reviewContent}>
                                </input>

                                {/* 이미지 업로드 */}
                                <div className={styles.filesBox}>
                                    <label className={styles.fileBtn} for="files">
                                        <div>
                                            <span> 사진 첨부하기 </span>
                                            <i class='bx bxs-file-image'/>
                                        </div>
                                    </label>
                                    <input type="file" accept="image/*" id='files' className={styles.files} onChange={handleImageChange} multiple/>
                                </div>
                                <span className={styles.filesTitle}>첨부파일은 최대 4개까지만 가능합니다</span>
                                {/* 이미지 미리보기 */}
                                <div className={styles.previewContainer}>
                                    {renderPreviewImages()}
                                </div>
                                <button onClick={handleSubmit} disabled={isSubmitting}>
                                    {/* disabled -> 폼 요소를 비활성화 */}
                                    {isSubmitting ? '제출 중...' : '리뷰 제출'}
                                </button> 
                            </div>
                        </div>
                    </Modal>
                </div>
                <div className={styles.reviewsStarRating}>
                    <div><StarRating rating={averageRating} />&nbsp;&nbsp;<span>{averageRating.toFixed(1)}</span></div>
                    <div>
                        <ul>
                            <li>5점&nbsp;&nbsp;{ratingsCount[5]}명</li>
                            <li>4점&nbsp;&nbsp;{ratingsCount[4]}명</li>
                            <li>3점&nbsp;&nbsp;{ratingsCount[3]}명</li>
                            <li>2점&nbsp;&nbsp;{ratingsCount[2]}명</li>
                            <li>1점&nbsp;&nbsp;{ratingsCount[1]}명</li>
                        </ul>
                    </div>
                </div>
                <div className={styles.reviewsMain}>
                    <div className={styles.option}>
                        <div>베스트순</div>
                        <div>최신순</div>
                    </div>
                    <div className={styles.reviewBox}>
                        {console.log(reviews)}
                        {reviews.length > 0 ? (
                            (reviews || []).map((review, index) => (
                                <div key={index}>
                                    <div>
                                        <div>
                                            <div>
                                                {/* 리뷰 작성자의 프로필 이미지가 있으면 표시, 없으면 기본 이미지 표시 */}
                                                <img src={reviewAvatars[review.MEMBER_ID] || img} alt="profile"/>
                                            </div>
                                            <div>
                                                <div>{review.MEMBER_ID} </div>
                                                <div><StarRating rating={review.RATING} /></div>
                                            </div>
                                        </div>
                                        <div>
                                            {/* 세션 memberId와 review.MEMBER_ID가 같을 때만 수정/삭제 버튼을 보여줌 */}
                                            {memberId === review.MEMBER_ID ? (
                                                <>
                                                    <button onClick={handleModify}>수정</button>
                                                    <button onClick={() => { handleReviewDel(review.REVIEW_SEQ); }}>삭제</button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* 본인이 작성한 리뷰가 아닐 때만 좋아요/신고 버튼을 보여줌 */}
                                                    <button onClick={() => handleLikeClick(review.REVIEW_SEQ)}>
                                                        {likeCount[review.REVIEW_SEQ] > 0 && (<span>{likeCount[review.REVIEW_SEQ]}</span>)}&nbsp; 도움이 돼요
                                                    </button>
                                                    <button onClick={() => { handleReport(review.REVIEW_SEQ); }}>신고하기</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                        {(review.images || []).length > 0 ? (
                                            review.images.map((img, imgIndex) => (
                                                <div key={imgIndex}><img src={img.IMAGE_URL} alt='img'/></div>
                                            ))
                                        ) : (
                                            <div>이미지가 없습니다.</div> 
                                        )}
                                        </div>
                                        <div>
                                            <div>{review.REVIEW_DATE ? formatDate(review.REVIEW_DATE) : '날짜 없음'}</div> 
                                            <div>{review.REVIEW_CONTENTS}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>리뷰가 없습니다.</div> 
                        )}
                    </div>
                    <div>
                        <Paging page={page} count={totalReviews} perpage={itemsPerPage} setPage={handlePageChange} />
                    </div>
                </div>
            </div>
        </div>
    );
};
