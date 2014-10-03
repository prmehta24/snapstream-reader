#include <map>
#include <string>
#include <vector>
#include <iostream>

#include "boost/date_time/gregorian/gregorian.hpp"

#include "snap.h"
#include "gtest/gtest.h"
#include "gmock/gmock.h"

namespace {
  class ExcerptTest : public ::testing::Test {
  protected:
    std::vector<snap::Program> prog_vector;
    virtual void SetUp() {
      std::string s(R"ZZZ(

ï»¿Title: ABC World News Now
Description: Global news.
Channel: 6 - WPVI
Recorded On: 7/23/2014 2:11:00 AM
Original Air Date: 1/5/1992
Transcript Generated by SnapStream
==================================

,,  going to make this place your home ?????? 

[2:14:16 AM]

>> It every time we come back singing from a break. 
>> Off good voice. 
They've earned their wings. And you can, too. Together we can solve child hunger. Support feeding America and your local food bank at feedingamerica.org.

ï»¿Title: Your World With Neil Cavuto
Description: Money tips from Wall Street.
Channel: 360 - FNC
Recorded On: 7/23/2014 4:00:00 PM
Original Air Date: 10/7/1996
Transcript Generated by SnapStream
==================================

Hero before it became passe and awful like Facebook. Maybe we'll have something old from the '80s like all of us. Dow no good. See you later.  life. Like a snapshot, snapped then shot over and done. And those of us still alive just watch and wonder about last week and this week and almost too afraid to even think about next week. )ZZZ");
      std::istringstream iss(s);  
      snap::Program prog0(R"ZZZ(Title: ABC World News Now
Description: Global news.
Channel: 6 - WPVI
Recorded On: 7/23/2014 2:11:00 AM
Original Air Date: 1/5/1992
Transcript Generated by SnapStream
==================================

,,  going to make this place your home ?????? 

[2:14:16 AM]

>> It every time we come back singing from a break. 
>> Off good voice. 
They've earned their wings. And you can, too. Together we can solve child hunger. Support feeding America and your local food bank at feedingamerica.org.
)ZZZ");
      snap::Program prog1(R"ZZZ(Title: Your World With Neil Cavuto
Description: Money tips from Wall Street.
Channel: 360 - FNC
Recorded On: 7/23/2014 4:00:00 PM
Original Air Date: 10/7/1996
Transcript Generated by SnapStream
==================================

Hero before it became passe and awful like Facebook. Maybe we'll have something old from the '80s like all of us. Dow no good. See you later.  life. Like a snapshot, snapped then shot over and done. And those of us still alive just watch and wonder about last week and this week and almost too afraid to even think about next week. )ZZZ");
      prog_vector = snap::parse_programs(iss);
    }
    virtual void TearDown() { prog_vector.clear(); }
  };
  TEST_F(ExcerptTest, Constructor) {
    snap::Excerpt e(prog_vector[0], 145, 190);
    ASSERT_EQ(e.program_title, "ABC World News Now");
    ASSERT_EQ(e.date, "2014-07-23");
    ASSERT_EQ(e.text, "rned their wings. And you can, too. Together ");    
  }

  TEST_F(ExcerptTest, highlight_word) {
    snap::Excerpt e(prog_vector[0], 145, 190);
    e.highlight_word("wings");
    ASSERT_EQ("rned their <span style=\"color:red\">wings</span>. And you can, too. Together ",
              e.text);
    e.highlight_word("togeth*");
    ASSERT_EQ("wings", e.search_strings[0]);
    ASSERT_EQ("togeth*", e.search_strings[1]);
    ASSERT_EQ("rned their <span style=\"color:red\">wings</span>. And you can, too. <span style=\"color:red\">togeth</span>er ",
              e.text);
  }
}

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();    
}



