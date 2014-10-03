#include <map>
#include <string>
#include <vector>

#include "boost/date_time/gregorian/gregorian.hpp"

#include "snap.h"
#include "gtest/gtest.h"
#include "gmock/gmock.h"

TEST(Program, Default) {
  snap::Program prog(R"ZZZ(Title: CBS News Sunday Morning
Description: Singer Sarah McLachlan; White House conversations secretly recorded by President Richard Nixon; director and screenwriter Richard Linklater; hoarding.
Channel: 3 - KYW
Recorded On: 7/27/2014 9:00:00 AM
Original Air Date: 7/27/2014
Transcript Generated by SnapStream
==================================

Captioning made possible by Johnson & Johnson, where quality products for the American family have been a tradition for generations good morning, I am Charles Osgood and this is Sunday morning. Summertime is the season when countless Americans spend as much time as possible outside the house, and no wonder. All too many of them, the house that they are escaping is a full house. A house so full of stuff there is hardly any room for them. Peter, Rita braver will report our cover story. .. 
>> Has now been diagnosed as a mental disorder, hoarding. >> Up to 5 percent of Americans. 
)ZZZ");
  ASSERT_EQ("CBS News Sunday Morning", prog.title);
  ASSERT_EQ("Singer Sarah McLachlan; White House conversations secretly recorded by President Richard Nixon; director and screenwriter Richard Linklater; hoarding.", prog.description);
  ASSERT_EQ("3 - KYW", prog.channel);
  ASSERT_EQ("2014-07-27", prog.recorded_date);
  ASSERT_EQ("2014-07-27", prog.aired_date);
  ASSERT_EQ("Captioning made possible by Johnson & Johnson, where quality products for the American family have been a tradition for generations good morning, I am Charles Osgood and this is Sunday morning. Summertime is the season when countless Americans spend as much time as possible outside the house, and no wonder. All too many of them, the house that they are escaping is a full house. A house so full of stuff there is hardly any room for them. Peter, Rita braver will report our cover story. .. \n>> Has now been diagnosed as a mental disorder, hoarding. >> Up to 5 percent of Americans.", prog.text);
  ASSERT_EQ("captioning made possible by johnson & johnson, where quality products for the american family have been a tradition for generations good morning, i am charles osgood and this is sunday morning. summertime is the season when countless americans spend as much time as possible outside the house, and no wonder. all too many of them, the house that they are escaping is a full house. a house so full of stuff there is hardly any room for them. peter, rita braver will report our cover story. .. \n>> has now been diagnosed as a mental disorder, hoarding. >> up to 5 percent of americans.", prog.lower_text);

  snap::Program equal_prog(R"ZZZ(Title: CBS News Sunday Morning
Description: Singer Sarah McLachlan; White House conversations secretly recorded by President Richard Nixon; director and screenwriter Richard Linklater; hoarding.
Channel: 3 - KYW
Recorded On: 7/27/2014 9:00:00 AM
Original Air Date: 7/27/2014
Transcript Generated by SnapStream
==================================

Captioning made possible by Johnson & Johnson, where quality products for the American family have been a tradition for generations good morning, I am Charles Osgood and this is Sunday morning. Summertime is the season when countless Americans spend as much time as possible outside the house, and no wonder. All too many of them, the house that they are escaping is a full house. A house so full of stuff there is hardly any room for them. Peter, Rita braver will report our cover story. .. 
>> Has now been diagnosed as a mental disorder, hoarding. >> Up to 5 percent of Americans. 
)ZZZ");
  snap::Program inequal_prog(R"ZZZ(Title: CBS News Sunday Morning
Description: Singer Sarah McLachlan; White House conversations secretly recorded by President Richard Nixon; director and screenwriter Richard Linklater; hoarding.
Channel: 3 - KYW
Recorded On: 7/27/2014 9:00:00 AM
Original Air Date: 7/27/2014
Transcript Generated by SnapStream
==================================

blah bal afas
)ZZZ");
  ASSERT_EQ(prog, equal_prog);
  ASSERT_NE(prog, inequal_prog);
}

TEST(parse_programs, Default) {
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
  std::vector<snap::Program> prog_vector = snap::parse_programs(iss);
  ASSERT_EQ(prog_vector.size(), 2);
  ASSERT_EQ(prog0, prog_vector[0]);
  ASSERT_EQ(prog1, prog_vector[1]);
}


int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();    
}
